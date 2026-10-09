from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _ensure_column(table: str, column: str, ddl_type: str):
    """Añade una columna a una tabla existente si falta (migración ligera e idempotente).

    `Base.metadata.create_all` crea tablas nuevas pero NUNCA altera las existentes, así
    que las bases de datos creadas antes de añadir `clients.password_hash` se quedaban sin
    esa columna y el login fallaba con "no such column". Esto la añade en caliente.
    """
    insp = inspect(engine)
    if table not in insp.get_table_names():
        return
    existing = {c["name"] for c in insp.get_columns(table)}
    if column not in existing:
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type}"))


def _run_migrations():
    # Despliegues anteriores a la autenticación no tienen esta columna.
    _ensure_column("clients", "password_hash", "VARCHAR(255)")


def init_db():
    from app import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    _run_migrations()

    # Auto-inicializar catálogo SAT y parámetros fiscales si la base de datos es nueva
    try:
        from app.catalogos.seed import asegurar_catalogo_sat
        from app.catalogos.seed_fiscal import asegurar_parametros_fiscales
        db = SessionLocal()
        try:
            asegurar_catalogo_sat(db)
            asegurar_parametros_fiscales(db)
        finally:
            db.close()
    except Exception as e:
        print(f"[init_db] Advertencia en auto-seed del catálogo y fiscal: {e}")


