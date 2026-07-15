package middleware

import (
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type rateLimiter struct {
	mu       sync.Mutex
	visitors map[string][]time.Time
	limit    int
	window   time.Duration
}

func newRateLimiter(limit int, window time.Duration) *rateLimiter {
	rl := &rateLimiter{
		visitors: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
	go rl.cleanup()
	return rl
}

// cleanTimestamps filters out stale timestamps for a given IP and updates or
// deletes the map entry accordingly. Must be called while rl.mu is held.
func (rl *rateLimiter) cleanTimestamps(ip string, now time.Time) {
	timestamps := rl.visitors[ip]
	valid := timestamps[:0]
	for _, ts := range timestamps {
		if now.Sub(ts) < rl.window {
			valid = append(valid, ts)
		}
	}
	if len(valid) == 0 {
		delete(rl.visitors, ip)
	} else {
		rl.visitors[ip] = valid
	}
}

func (rl *rateLimiter) cleanup() {
	for {
		time.Sleep(time.Minute)
		rl.mu.Lock()
		now := time.Now()
		for ip := range rl.visitors {
			rl.cleanTimestamps(ip, now)
		}
		rl.mu.Unlock()
	}
}

// evictIfFull tenta liberar espaço no mapa de visitantes quando ele atinge
// a capacidade máxima. Primeiro limpa as entradas do IP atual e depois
// varre um subconjunto limitado de outros IPs. Retorna false se o mapa
// continuar cheio após a tentativa de evicção.
func (rl *rateLimiter) evictIfFull(ip string, now time.Time) bool {
	const maxVisitors = 10000
	const evictBatchSize = 100

	if len(rl.visitors) < maxVisitors {
		return true
	}

	rl.cleanTimestamps(ip, now)
	if len(rl.visitors) < maxVisitors {
		return true
	}

	count := 0
	for otherIP := range rl.visitors {
		if otherIP == ip {
			continue
		}
		rl.cleanTimestamps(otherIP, now)
		count++
		if count >= evictBatchSize {
			break
		}
	}

	return len(rl.visitors) < maxVisitors
}

func (rl *rateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()

	if !rl.evictIfFull(ip, now) {
		return false
	}

	timestamps := rl.visitors[ip]

	var valid []time.Time
	for _, ts := range timestamps {
		if now.Sub(ts) < rl.window {
			valid = append(valid, ts)
		}
	}

	if len(valid) >= rl.limit {
		rl.visitors[ip] = valid
		return false
	}

	rl.visitors[ip] = append(valid, now)
	return true
}

// RateLimit returns a per-instance rate limiter. When deployed behind a load
// balancer with N instances, the effective limit is limit × N. For production
// deployments requiring strict rate limiting, use a distributed store (Redis).
func RateLimit(limit int, window time.Duration) gin.HandlerFunc {
	rl := newRateLimiter(limit, window)
	return func(c *gin.Context) {
		// Use RemoteIP() instead of ClientIP() to ignore X-Forwarded-For /
		// X-Real-IP headers, preventing trivial rate-limit bypass via header
		// spoofing. Strip the TCP port so all connections from the same IP
		// share the same rate-limit bucket.
		ip := c.Request.RemoteAddr
		if host, _, err := net.SplitHostPort(ip); err == nil {
			ip = host
		}
		if !rl.allow(ip) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"message": "Muitas requisições. Aguarde um momento e tente novamente.",
			})
			return
		}
		c.Next()
	}
}
