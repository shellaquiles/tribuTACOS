from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import init_db
from app.cfdis.router import router as cfdis_router
from app.auth.router import router as auth_router
from app.sat_docs.router import router as sat_docs_router
from app.catalogos.router import router as catalogos_router
from app.config import VERSION, CORS_ORIGINS
from app.static_server import resolve_static_dir, should_serve_static

init_db()

app = FastAPI(
    title="tribuTACOS API",
    description="Radiografia fiscal y desmenuzador universal de CFDIs (XML)",
    version=VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(cfdis_router)
app.include_router(sat_docs_router)
app.include_router(catalogos_router)


@app.get("/api/health")
def health():
    return {
        "app": "🌮 tributacos",
        "tagline": "Porque cuadrar tus impuestos con el SAT debería ser tan transparente y directo como pedir tacos en la esquina.",
        "status": "ready",
        "version": VERSION,
        "docs_url": "/docs",
    }


_static_dir = resolve_static_dir() if should_serve_static() else None
if _static_dir is not None:
    app.mount("/", StaticFiles(directory=str(_static_dir), html=True), name="frontend")
else:

    @app.get("/")
    def root():
        return health()


if __name__ == "__main__":
    import uvicorn
    from app.config import HOST, PORT

    uvicorn.run(app, host=HOST, port=PORT)
