from typing import Generator, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.utils.logger import logger

# Initialize engine with PostgreSQL, with resilient dev fallback if PG server is offline
def _init_engine():
    try:
        pg_engine = create_engine(
            settings.SQLALCHEMY_DATABASE_URI,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
        )
        # Attempt connection test
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"Connected to PostgreSQL at {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}")
        return pg_engine
    except Exception as exc:
        logger.warning(
            f"PostgreSQL at {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT} is not currently running. "
            f"Using local development SQLite database (sqlite:///./tailor_marketplace_dev.db) so authentication and API routes are live."
        )
        return create_engine(
            "sqlite:///./tailor_marketplace_dev.db",
            connect_args={"check_same_thread": False},
        )


engine = _init_engine()

# Session factory for DB operations
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding database session per request.
    Closes the session after request lifecycle completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> Dict[str, Any]:
    """
    Safely ping database to verify connectivity without crashing the service.
    Returns connectivity status and details.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        is_pg = engine.dialect.name == "postgresql"
        return {
            "status": "connected",
            "connected": True,
            "message": f"{'PostgreSQL' if is_pg else 'SQLite Dev'} database connected successfully",
            "dialect": engine.dialect.name,
            "host": settings.POSTGRES_SERVER if is_pg else "local_file",
            "database": settings.POSTGRES_DB if is_pg else "tailor_marketplace_dev.db",
        }
    except Exception as exc:
        return {
            "status": "disconnected",
            "connected": False,
            "message": "Database connection failed",
            "host": settings.POSTGRES_SERVER,
            "database": settings.POSTGRES_DB,
            "error": str(exc),
        }


def sync_database_columns(target_engine):
    """
    Safely ensures newly introduced international columns exist on existing tables.
    Works seamlessly on both PostgreSQL and SQLite.
    """
    from sqlalchemy import inspect
    try:
        inspector = inspect(target_engine)
        existing_tables = set(inspector.get_table_names())

        columns_to_ensure = [
            ("customers", "country", "VARCHAR(100) DEFAULT 'India'"),
            ("customers", "country_code", "VARCHAR(10) DEFAULT 'IN'"),
            ("customers", "currency", "VARCHAR(10) DEFAULT 'INR'"),
            ("customers", "postal_code", "VARCHAR(50)"),
            ("delivery_addresses", "country", "VARCHAR(100) DEFAULT 'India'"),
            ("delivery_addresses", "country_code", "VARCHAR(10) DEFAULT 'IN'"),
            ("delivery_addresses", "postal_code", "VARCHAR(50)"),
            ("users", "country", "VARCHAR(100) DEFAULT 'India'"),
            ("users", "currency", "VARCHAR(10) DEFAULT 'INR'"),
            ("orders", "currency", "VARCHAR(10) DEFAULT 'USD'"),
            ("orders", "payment_status", "VARCHAR(50) DEFAULT 'UNPAID'"),
        ]

        with target_engine.connect() as conn:
            for table, col, col_def in columns_to_ensure:
                if table in existing_tables:
                    existing_cols = {c["name"] for c in inspector.get_columns(table)}
                    if col not in existing_cols:
                        try:
                            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_def}"))
                            conn.commit()
                            logger.info(f"Added international column '{col}' to table '{table}'.")
                        except Exception as e:
                            logger.warning(f"Column sync note on {table}.{col}: {e}")
    except Exception as exc:
        logger.warning(f"Schema sync note: {exc}")
