import json
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, Text, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Client(Base):
    __tablename__ = "clients"

    id = Column(String(50), primary_key=True, index=True) # slug or uuid
    name = Column(String(200), nullable=False)
    rfc = Column(String(13), nullable=False, index=True)
    email = Column(String(120), nullable=True)
    plan = Column(String(50), default="basic")
    local_path_emitidos = Column(String(500), nullable=True)
    local_path_recibidos = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    cfdis = relationship("Cfdi", back_populates="client", cascade="all, delete-orphan")
    caches = relationship("SummaryCache", back_populates="client", cascade="all, delete-orphan")


class Cfdi(Base):
    __tablename__ = "cfdis"

    id = Column(String(100), primary_key=True) # UUID fiscal
    client_id = Column(String(50), ForeignKey("clients.id"), primary_key=True, index=True)
    filename = Column(String(300), nullable=True)
    filepath = Column(String(500), nullable=True)
    categoria = Column(String(50), index=True) # ingreso | egreso | nomina | pago | retencion
    tipo = Column(String(10), nullable=True)    # I | E | N | P
    fecha = Column(String(30), index=True)      # ISO string
    year = Column(String(4), index=True)
    emisor_rfc = Column(String(13), index=True)
    emisor_nombre = Column(String(250), nullable=True)
    receptor_rfc = Column(String(13), index=True)
    receptor_nombre = Column(String(250), nullable=True)
    uso_cfdi = Column(String(10), nullable=True)
    metodo_pago = Column(String(10), nullable=True)
    forma_pago = Column(String(10), nullable=True)
    subtotal = Column(Float, default=0.0)
    descuento = Column(Float, default=0.0)
    iva = Column(Float, default=0.0)
    retencion_isr = Column(Float, default=0.0)
    retencion_iva = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    es_interes = Column(Boolean, default=False)
    parsed_data = Column(Text, nullable=True) # JSON dump for complex structures (conceptos, deducciones, etc.)
    parsed_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="cfdis")

    __table_args__ = (
        UniqueConstraint('client_id', 'id', name='_client_uuid_uc'),
    )

    def to_dict(self):
        if self.parsed_data:
            try:
                base = json.loads(self.parsed_data)
                base["id"] = self.id
                base["uuid"] = self.id
                base["categoria"] = self.categoria
                base["filename"] = self.filename
                return base
            except Exception:
                pass
        return {
            "uuid": self.id,
            "id": self.id,
            "fecha": self.fecha,
            "emisor_rfc": self.emisor_rfc,
            "emisor_nombre": self.emisor_nombre,
            "receptor_rfc": self.receptor_rfc,
            "receptor_nombre": self.receptor_nombre,
            "uso_cfdi": self.uso_cfdi,
            "metodo_pago": self.metodo_pago,
            "forma_pago": self.forma_pago,
            "subtotal": self.subtotal,
            "descuento": self.descuento,
            "iva": self.iva,
            "retencion_isr": self.retencion_isr,
            "retencion_iva": self.retencion_iva,
            "total": self.total,
            "es_interes": self.es_interes,
            "categoria": self.categoria,
            "filename": self.filename,
        }


class UploadBatch(Base):
    __tablename__ = "upload_batches"

    id = Column(String(50), primary_key=True)
    client_id = Column(String(50), ForeignKey("clients.id"))
    source = Column(String(50), default="upload") # 'upload' | 'local_path'
    files_total = Column(Integer, default=0)
    files_ok = Column(Integer, default=0)
    files_error = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class SummaryCache(Base):
    __tablename__ = "summary_caches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    client_id = Column(String(50), ForeignKey("clients.id"), index=True)
    year = Column(String(4), index=True)
    summary_json = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="caches")

    __table_args__ = (
        UniqueConstraint('client_id', 'year', name='_client_year_cache_uc'),
    )


class DeclaracionAnualSAT(Base):
    __tablename__ = "declaraciones_anuales_sat"

    id = Column(String(100), primary_key=True) # e.g. HECA850101XYZ_2024_Op250500190419
    client_id = Column(String(50), ForeignKey("clients.id"), index=True)
    rfc = Column(String(13), index=True, nullable=False)
    year = Column(String(4), index=True, nullable=False)
    tipo_declaracion = Column(String(30), default="Normal")
    num_operacion = Column(String(50), index=True)
    fecha_presentacion = Column(String(50))
    ingresos_acumulables = Column(Float, default=0.0)
    deducciones_personales = Column(Float, default=0.0)
    base_gravable = Column(Float, default=0.0)
    isr_tarifa = Column(Float, default=0.0)
    pagos_provisionales_acreditados = Column(Float, default=0.0)
    isr_retenido = Column(Float, default=0.0)
    saldo_a_favor = Column(Float, default=0.0)
    saldo_a_cargo = Column(Float, default=0.0)
    parcialidades = Column(Integer, default=0)
    destino_saldo = Column(String(50), nullable=True) # Devolución | Compensación
    clabe = Column(String(30), nullable=True)
    banco = Column(String(100), nullable=True)
    raw_pdf_path = Column(String(500), nullable=True)
    parsed_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client")


class PagoProvisionalSAT(Base):
    __tablename__ = "pagos_provisionales_sat"

    id = Column(String(100), primary_key=True) # e.g. HECA850101XYZ_2024_04_Op618297908
    client_id = Column(String(50), ForeignKey("clients.id"), index=True)
    rfc = Column(String(13), index=True, nullable=False)
    year = Column(String(4), index=True, nullable=False)
    mes_numero = Column(Integer, index=True, nullable=False)
    mes_nombre = Column(String(20))
    tipo_declaracion = Column(String(30), default="Normal")
    num_operacion = Column(String(50), index=True)
    fecha_presentacion = Column(String(50))
    isr_ingresos_periodo = Column(Float, default=0.0)
    isr_ingresos_acumulados = Column(Float, default=0.0)
    isr_deducciones_autorizadas = Column(Float, default=0.0)
    isr_base_gravable = Column(Float, default=0.0)
    isr_causado = Column(Float, default=0.0)
    isr_retenido_periodo = Column(Float, default=0.0)
    isr_a_cargo = Column(Float, default=0.0)
    iva_base_gravada_16 = Column(Float, default=0.0)
    iva_cobrado_16 = Column(Float, default=0.0)
    iva_acreditable_gastos = Column(Float, default=0.0)
    iva_retenido = Column(Float, default=0.0)
    iva_a_cargo = Column(Float, default=0.0)
    total_pagado = Column(Float, default=0.0)
    tiene_acuse_pago = Column(Boolean, default=False)
    total_pagado_acuse = Column(Float, default=0.0)
    raw_pdf_path = Column(String(500), nullable=True)
    raw_acuse_path = Column(String(500), nullable=True)
    parsed_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client")


class AcusePagoSAT(Base):
    __tablename__ = "acuses_pagos_sat"

    id = Column(String(100), primary_key=True) # e.g. HECA850101XYZ_2022_01_Acuse_463342775
    client_id = Column(String(50), ForeignKey("clients.id"), index=True)
    rfc = Column(String(13), index=True, nullable=False)
    year = Column(String(4), index=True, nullable=False)
    mes_numero = Column(Integer, index=True, nullable=False)
    num_operacion = Column(String(50), index=True)
    fecha_presentacion = Column(String(50))
    monto_isr_pagado = Column(Float, default=0.0)
    monto_iva_pagado = Column(Float, default=0.0)
    total_pagado = Column(Float, default=0.0)
    raw_pdf_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client")


class CatalogoSatClave(Base):
    __tablename__ = "catalogo_sat_claves"

    clave = Column(String(20), primary_key=True, index=True) # Clave de 8 dígitos, 4 dígitos o 2 dígitos
    nivel = Column(String(20), index=True) # 'producto' | 'familia' | 'segmento'
    categoria_id = Column(String(50), index=True, nullable=False) # ej. 'vuelos_aviones', 'computo_hardware'
    nombre = Column(String(150), nullable=False) # ej. 'Boletos de Avión y Vuelos'
    icono = Column(String(10), default="📋")
    color = Column(String(20), default="#475569")
    descripcion_sat = Column(String(300), nullable=True)
    palabras_similares = Column(Text, nullable=True)
    tipo_gasto = Column(String(50), default="operativo") # 'operativo' | 'inversion' | 'viaticos' | 'financiero'
    updated_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "clave": self.clave,
            "nivel": self.nivel,
            "id": self.categoria_id,
            "nombre": self.nombre,
            "icono": self.icono,
            "color": self.color,
            "descripcion_sat": self.descripcion_sat,
            "palabras_similares": self.palabras_similares,
            "tipo_gasto": self.tipo_gasto
        }


class CfdiExclusion(Base):
    __tablename__ = "cfdi_exclusions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    client_id = Column(String(50), ForeignKey("clients.id"), index=True, nullable=False)
    uuid = Column(String(100), index=True, nullable=False)
    motivo = Column(String(250), nullable=True)
    tipo = Column(String(30), default="ignorar")  # 'ignorar' | 'forzar_deducible' | 'forzar_no_deducible'
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client")

    __table_args__ = (
        UniqueConstraint('client_id', 'uuid', name='_client_uuid_exclusion_uc'),
    )


class ConstanciaFiscalExterna(Base):
    __tablename__ = "constancias_fiscales_externas"

    id = Column(String(100), primary_key=True)
    client_id = Column(String(50), ForeignKey("clients.id"), index=True, nullable=False)
    year = Column(String(4), index=True, nullable=False)
    uso_cfdi = Column(String(10), default="D06")
    emisor_rfc = Column(String(13), nullable=True)
    emisor_nombre = Column(String(250), nullable=True)
    fecha = Column(String(30), nullable=True)
    monto = Column(Float, default=0.0)
    descripcion = Column(String(300), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client")


class TarifaIsrAnual(Base):
    __tablename__ = "tarifas_isr_anuales"

    id = Column(Integer, primary_key=True, autoincrement=True)
    year = Column(String(4), index=True, nullable=False)
    limite_inferior = Column(Float, nullable=False)
    limite_superior = Column(Float, nullable=False)
    cuota_fija = Column(Float, default=0.0)
    porcentaje_excedente = Column(Float, default=0.0)
    orden = Column(Integer, default=0)

    __table_args__ = (
        UniqueConstraint('year', 'orden', name='_year_tarifa_orden_uc'),
    )


class ParametroSat(Base):
    __tablename__ = "parametros_sat"

    year = Column(String(4), primary_key=True)
    uma_diaria = Column(Float, nullable=False)
    uma_mensual = Column(Float, nullable=False)
    uma_anual = Column(Float, nullable=False)
    uma_5_anual = Column(Float, nullable=False)
    tope_deducciones_pct = Column(Float, default=15.0)
    salario_minimo = Column(Float, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)

