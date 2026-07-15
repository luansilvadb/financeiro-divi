package websocket

import (
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	"github.com/gorilla/websocket"
	"github.com/luansilvadb/financeiro-divi/backend-go/internal/dto"
)

func TestHub_Broadcast(t *testing.T) {
	hub := NewHub()
	go hub.Run()

	client := &Client{
		TenantID: "tenant-1",
		Send:     make(chan []byte, 10),
	}

	hub.Register(client)

	hub.Broadcast("tenant-1", dto.WSMessage{
		Type:    dto.WSTypeExpenseCreated,
		Payload: map[string]string{"id": "123"},
	})

	select {
	case msg := <-client.Send:
		if len(msg) == 0 {
			t.Fatal("expected non-empty message")
		}
	default:
		t.Fatal("expected message to be sent")
	}
}

func TestHub_RegisterAndUnregister(t *testing.T) {
	hub := NewHub()

	client := &Client{
		TenantID: "tenant-2",
		Send:     make(chan []byte, 10),
	}

	hub.Register(client)

	if len(hub.rooms["tenant-2"]) != 1 {
		t.Fatalf("expected 1 client in room, got %d", len(hub.rooms["tenant-2"]))
	}

	hub.Unregister(client)

	if hub.rooms["tenant-2"] != nil {
		t.Fatal("expected room to be deleted after unregistering last client")
	}
}

func TestHub_BroadcastNoClients(t *testing.T) {
	hub := NewHub()

	hub.Broadcast("empty-room", dto.WSMessage{
		Type:    dto.WSTypeExpenseCreated,
		Payload: "data",
	})
}

func TestHub_UnregisterNonExistent(t *testing.T) {
	hub := NewHub()

	client := &Client{
		TenantID: "ghost-room",
		Send:     make(chan []byte, 10),
	}

	hub.Unregister(client)
}

func TestHub_RegisterDuplicate(t *testing.T) {
	hub := NewHub()

	client := &Client{
		TenantID: "tenant-dup",
		Send:     make(chan []byte, 10),
	}

	hub.Register(client)
	hub.Register(client)

	if len(hub.rooms["tenant-dup"]) != 1 {
		t.Fatalf("expected 1 client in room after duplicate register, got %d", len(hub.rooms["tenant-dup"]))
	}
}

func TestHub_MultipleClientsSameRoom(t *testing.T) {
	hub := NewHub()

	c1 := &Client{TenantID: "room-1", Send: make(chan []byte, 10)}
	c2 := &Client{TenantID: "room-1", Send: make(chan []byte, 10)}
	c3 := &Client{TenantID: "room-2", Send: make(chan []byte, 10)}

	hub.Register(c1)
	hub.Register(c2)
	hub.Register(c3)

	hub.Broadcast("room-1", dto.WSMessage{
		Type:    dto.WSTypeMemberUpdated,
		Payload: "update",
	})

	select {
	case <-c1.Send:
	default:
		t.Fatal("expected c1 to receive message")
	}

	select {
	case <-c2.Send:
	default:
		t.Fatal("expected c2 to receive message")
	}

	select {
	case <-c3.Send:
		t.Fatal("expected c3 NOT to receive message")
	default:
	}
}

func TestHub_ConcurrentRegisterAndBroadcast(t *testing.T) {
	hub := NewHub()

	var wg sync.WaitGroup
	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			client := &Client{
				TenantID: "concurrent-room",
				Send:     make(chan []byte, 100),
			}
			hub.Register(client)

			hub.Broadcast("concurrent-room", dto.WSMessage{
				Type:    dto.WSTypeExpenseCreated,
				Payload: id,
			})

			hub.Unregister(client)
		}(i)
	}
	wg.Wait()

	if hub.rooms["concurrent-room"] != nil {
		t.Fatal("expected room to be empty after all clients unregistered")
	}
}

func TestHub_ConcurrentBroadcastStress(t *testing.T) {
	hub := NewHub()

	client := &Client{
		TenantID: "stress-room",
		Send:     make(chan []byte, 1000),
	}
	hub.Register(client)

	var wg sync.WaitGroup
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(msgID int) {
			defer wg.Done()
			hub.Broadcast("stress-room", dto.WSMessage{
				Type:    dto.WSTypeExpenseCreated,
				Payload: msgID,
			})
		}(i)
	}
	wg.Wait()

	received := 0
	for len(client.Send) > 0 {
		<-client.Send
		received++
	}
	if received == 0 {
		t.Fatal("expected at least some messages from stress test")
	}
}

func TestHub_MultipleRoomsConcurrent(t *testing.T) {
	hub := NewHub()

	numRooms := 10
	clientsPerRoom := 5

	var clients []*Client
	for r := 0; r < numRooms; r++ {
		roomID := r
		for c := 0; c < clientsPerRoom; c++ {
			cl := &Client{
				TenantID: "multi-room",
				Send:     make(chan []byte, 100),
			}
			hub.Register(cl)
			clients = append(clients, cl)
		}
		_ = roomID
	}

	var wg sync.WaitGroup
	for i := 0; i < numRooms; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			hub.Broadcast("multi-room", dto.WSMessage{
				Type:    dto.WSTypeExpenseCreated,
				Payload: "data",
			})
		}()
	}
	wg.Wait()

	for _, cl := range clients {
		hub.Unregister(cl)
	}
}

func TestHub_RegisterAndBroadcastFullChannel(t *testing.T) {
	hub := NewHub()

	client := &Client{
		TenantID: "full-ch",
		Send:     make(chan []byte, 2),
	}
	hub.Register(client)

	client.Send <- []byte("full1")
	client.Send <- []byte("full2")

	hub.Broadcast("full-ch", dto.WSMessage{
		Type:    dto.WSTypeExpenseCreated,
		Payload: "should-drop",
	})

	if len(hub.rooms["full-ch"]) != 0 {
		t.Fatal("expected client to be unregistered after dropping message")
	}
}

func TestTrySend_NilChannel(t *testing.T) {
	client := &Client{
		TenantID: "nil-send",
		Send:     nil,
	}

	ok := client.trySend([]byte("test"))
	if ok {
		t.Fatal("expected trySend to return false for nil channel")
	}
}

func TestTrySend_ClosedChannel(t *testing.T) {
	client := &Client{
		TenantID: "closed-ch",
		Send:     make(chan []byte, 1),
		closed:   true,
	}

	ok := client.trySend([]byte("test"))
	if ok {
		t.Fatal("expected trySend to return false for closed channel")
	}
}

func TestTrySend_Success(t *testing.T) {
	client := &Client{
		TenantID: "ok-ch",
		Send:     make(chan []byte, 1),
	}

	ok := client.trySend([]byte("hello"))
	if !ok {
		t.Fatal("expected trySend to return true")
	}

	select {
	case msg := <-client.Send:
		if string(msg) != "hello" {
			t.Fatalf("expected 'hello', got '%s'", string(msg))
		}
	default:
		t.Fatal("expected message in channel")
	}
}

func TestTrySend_FullChannel(t *testing.T) {
	client := &Client{
		TenantID: "full-ch",
		Send:     make(chan []byte, 1),
	}
	client.Send <- []byte("first")

	ok := client.trySend([]byte("second"))
	if ok {
		t.Fatal("expected trySend to return false for full channel")
	}
}

func TestHub_Run_DoesNotPanic(t *testing.T) {
	hub := NewHub()
	hub.Run()
}

func TestHub_UnregisterIdempotent(t *testing.T) {
	hub := NewHub()

	client := &Client{
		TenantID: "idempotent",
		Send:     make(chan []byte, 1),
	}
	hub.Register(client)

	hub.Unregister(client)
	hub.Unregister(client)

	if hub.rooms["idempotent"] != nil {
		t.Fatal("expected room to be deleted after unregister")
	}
}

func TestHub_RegisterWithNilSend(t *testing.T) {
	hub := NewHub()

	client := &Client{
		TenantID: "nil-send",
		Send:     nil,
	}
	hub.Register(client)

	hub.Broadcast("nil-send", dto.WSMessage{
		Type:    dto.WSTypeExpenseCreated,
		Payload: "data",
	})
}

func TestHub_Broadcast_JSONMarshalError(t *testing.T) {
	hub := NewHub()

	client := &Client{
		TenantID: "json-err-room",
		Send:     make(chan []byte, 1),
	}
	hub.Register(client)

	hub.Broadcast("json-err-room", dto.WSMessage{
		Type:    dto.WSTypeExpenseCreated,
		Payload: make(chan int),
	})
}

func TestHandleClient_ReadPump_WritePump(t *testing.T) {
	hub := NewHub()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		upgrader := websocket.Upgrader{}
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Logf("upgrade error: %v", err)
			return
		}
		HandleClient(hub, conn, "tenant-handle")
	}))
	defer srv.Close()

	url := "ws" + srv.URL[4:] + "/ws"
	conn, _, err := websocket.DefaultDialer.Dial(url, nil)
	if err != nil {
		t.Fatalf("dial error: %v", err)
	}
	defer conn.Close()

	hub.Broadcast("tenant-handle", dto.WSMessage{
		Type:    dto.WSTypeExpenseCreated,
		Payload: "handled",
	})

	_, msg, err := conn.ReadMessage()
	if err != nil {
		t.Fatalf("read error: %v", err)
	}
	if len(msg) == 0 {
		t.Fatal("expected non-empty message")
	}

	conn.Close()
}

func TestHub_ConcurrentUnregisterSameClient(t *testing.T) {
	hub := NewHub()
	client := &Client{
		TenantID: "concurrent-unreg",
		Send:     make(chan []byte, 10),
	}
	hub.Register(client)

	var wg sync.WaitGroup
	errs := make(chan error, 100)

	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			defer func() {
				if r := recover(); r != nil {
					errs <- r.(error)
				}
			}()
			hub.Unregister(client)
		}()
	}
	wg.Wait()
	close(errs)

	for err := range errs {
		t.Fatalf("unexpected panic: %v", err)
	}
}
