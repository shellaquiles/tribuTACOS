from sqlalchemy import create_engine
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

def init_db():
    from app import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    
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


