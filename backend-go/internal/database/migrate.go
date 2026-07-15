// Package database provides database bootstrap and migration utilities.
//
// Migration strategy: GORM AutoMigrate (in cmd/server/main.go) is the primary
// schema management tool. Raw SQL migrations in the migrations/ directory are
// supplementary for operations AutoMigrate cannot express (e.g. adding UNIQUE
// constraints, creating indexes). RunSQLMigrations is available for manual or
// CI-driven execution of those raw SQL files.
//
// Known limitation: splitSQL does not handle PostgreSQL dollar-quoting ($$).
// Avoid using dollar-quoted strings in migration SQL files.
package database

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"gorm.io/gorm"
)

func RunSQLMigrations(db *gorm.DB, migrationsDir string) error {
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to read migrations directory %s: %w", migrationsDir, err)
	}

	var files []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	for _, fname := range files {
		path := filepath.Join(migrationsDir, fname)
		content, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("failed to read %s: %w", path, err)
		}

		statements := splitSQL(string(content))
		for i, stmt := range statements {
			stmt = strings.TrimSpace(stmt)
			if stmt == "" {
				continue
			}
			if err := db.Exec(stmt).Error; err != nil {
				return fmt.Errorf("migration %s statement %d failed: %w", fname, i+1, err)
			}
		}
	}

	return nil
}

func splitSQL(sql string) []string {
	var result []string
	var current strings.Builder
	inString := false

	for _, ch := range sql {
		switch ch {
		case '\'':
			inString = !inString
			current.WriteRune(ch)
		case ';':
			if !inString {
				result = append(result, current.String())
				current.Reset()
			} else {
				current.WriteRune(ch)
			}
		default:
			current.WriteRune(ch)
		}
	}

	remaining := strings.TrimSpace(current.String())
	if remaining != "" {
		result = append(result, remaining)
	}

	return result
}
