from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.cfdis.router import router as cfdis_router
from app.auth.router import router as auth_router
from app.sat_docs.router import router as sat_docs_router
from app.catalogos.router import router as catalogos_router

# Initialize database schema
init_db()

app = FastAPI(
    title="🌮 tributacos API",
    description="Radiografía fiscal y desmenuzador universal de CFDIs (XML)",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount modular routers
app.include_router(auth_router)
app.include_router(cfdis_router)
app.include_router(sat_docs_router)
app.include_router(catalogos_router)

@app.get("/")
def root():
    return {
        "app": "🌮 tributacos",
        "tagline": "Porque cuadrar tus impuestos con el SAT debería ser tan transparente y directo como pedir tacos en la esquina.",
        "status": "ready",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8010)
