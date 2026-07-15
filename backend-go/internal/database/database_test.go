package database

import (
	"os"
	"path/filepath"
	"testing"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func setupMockDB(t *testing.T) (*gorm.DB, sqlmock.Sqlmock) {
	t.Helper()
	sqlDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	t.Cleanup(func() { sqlDB.Close() })
	dialector := postgres.New(postgres.Config{Conn: sqlDB})
	gormDB, err := gorm.Open(dialector, &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open gorm: %v", err)
	}
	return gormDB, mock
}

func TestSplitSQL_simple(t *testing.T) {
	input := "CREATE TABLE foo (id INT); INSERT INTO bar VALUES (1);"
	result := splitSQL(input)
	if len(result) != 2 {
		t.Fatalf("expected 2 statements, got %d", len(result))
	}
	if result[0] != "CREATE TABLE foo (id INT)" {
		t.Errorf("stmt 0: %q", result[0])
	}
	if result[1] != " INSERT INTO bar VALUES (1)" {
		t.Errorf("stmt 1: %q", result[1])
	}
}

func TestSplitSQL_stringLiteral(t *testing.T) {
	input := `INSERT INTO t VALUES ('hello; world'); SELECT 1;`
	result := splitSQL(input)
	if len(result) != 2 {
		t.Fatalf("expected 2 statements, got %d", len(result))
	}
	if result[0] != `INSERT INTO t VALUES ('hello; world')` {
		t.Errorf("stmt 0: %q", result[0])
	}
}

func TestSplitSQL_emptyInput(t *testing.T) {
	result := splitSQL("")
	if len(result) != 0 {
		t.Errorf("expected 0, got %d", len(result))
	}
}

func TestSplitSQL_noSemicolon(t *testing.T) {
	result := splitSQL("SELECT 1")
	if len(result) != 1 {
		t.Fatalf("expected 1, got %d", len(result))
	}
	if result[0] != "SELECT 1" {
		t.Errorf("got %q", result[0])
	}
}

func TestSplitSQL_multiline(t *testing.T) {
	input := `CREATE TABLE t (
  id INT
);
ALTER TABLE t ADD COLUMN x TEXT;`
	result := splitSQL(input)
	if len(result) != 2 {
		t.Fatalf("expected 2, got %d", len(result))
	}
}

func TestSplitSQL_trailingSemicolon(t *testing.T) {
	input := "SELECT 1;"
	result := splitSQL(input)
	if len(result) != 1 {
		t.Fatalf("expected 1, got %d", len(result))
	}
	if result[0] != "SELECT 1" {
		t.Errorf("got %q", result[0])
	}
}

func TestSplitSQL_escapedQuote(t *testing.T) {
	input := `SELECT 'it''s; nice'; SELECT 2;`
	result := splitSQL(input)
	if len(result) != 2 {
		t.Fatalf("expected 2, got %d", len(result))
	}
}

func TestRunSQLMigrations(t *testing.T) {
	dir := t.TempDir()
	err := os.WriteFile(filepath.Join(dir, "001_init.sql"), []byte("CREATE TABLE foo (id INT); CREATE INDEX idx_foo ON foo(id);"), 0644)
	if err != nil {
		t.Fatal(err)
	}
	err = os.WriteFile(filepath.Join(dir, "002_add_bar.sql"), []byte("ALTER TABLE foo ADD COLUMN bar TEXT;"), 0644)
	if err != nil {
		t.Fatal(err)
	}

	db, mock := setupMockDB(t)
	mock.ExpectExec("CREATE TABLE foo").WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec("CREATE INDEX idx_foo").WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec("ALTER TABLE foo").WillReturnResult(sqlmock.NewResult(0, 0))

	if err := RunSQLMigrations(db, dir); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestRunSQLMigrations_emptyDir(t *testing.T) {
	dir := t.TempDir()
	db, mock := setupMockDB(t)

	if err := RunSQLMigrations(db, dir); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestRunSQLMigrations_nonexistentDir(t *testing.T) {
	db, _ := setupMockDB(t)
	err := RunSQLMigrations(db, filepath.Join(os.TempDir(), "nonexistent-migrations-12345"))
	if err == nil {
		t.Fatal("expected error for nonexistent directory")
	}
}

func TestRunSQLMigrations_migrationError(t *testing.T) {
	dir := t.TempDir()
	err := os.WriteFile(filepath.Join(dir, "001_fail.sql"), []byte("INVALID SQL;"), 0644)
	if err != nil {
		t.Fatal(err)
	}

	db, mock := setupMockDB(t)
	mock.ExpectExec("INVALID SQL").WillReturnError(gorm.ErrInvalidDB)

	err = RunSQLMigrations(db, dir)
	if err == nil {
		t.Fatal("expected error for invalid SQL")
	}
}
