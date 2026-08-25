"""
Taxonomía Contable y Clasificación Maestra SAT
Define los rubros, segmentos, familias UNSPSC, claves prioritarias, colores,
iconos y tipo contable para la clasificación fiscal de conceptos de egreso.
"""

from typing import Dict, Any

# ─── SEGMENTOS UNSPSC (2 Dígitos) ───
TAXONOMIA_SEGMENTOS: Dict[str, Dict[str, str]] = {
    '15': {'id': 'combustibles', 'nombre': 'Combustibles y Lubricantes', 'icono': '⛽', 'color': '#f97316', 'tipo': 'operativo'},
    '25': {'id': 'refacciones_autos', 'nombre': 'Vehículos y Refacciones', 'icono': '🚗', 'color': '#3b82f6', 'tipo': 'operativo'},
    '32': {'id': 'electronica', 'nombre': 'Componentes Electrónicos', 'icono': '🔌', 'color': '#0284c7', 'tipo': 'operativo'},
    '43': {'id': 'computo_ti', 'nombre': 'Tecnología y Cómputo', 'icono': '💻', 'color': '#0ea5e9', 'tipo': 'inversion'},
    '44': {'id': 'oficina_papeleria', 'nombre': 'Papelería e Insumos de Oficina', 'icono': '📎', 'color': '#14b8a6', 'tipo': 'operativo'},
    '50': {'id': 'alimentos', 'nombre': 'Alimentos y Abarrotes', 'icono': '🍎', 'color': '#84cc16', 'tipo': 'operativo'},
    '51': {'id': 'salud_medicamentos', 'nombre': 'Medicamentos y Salud', 'icono': '💊', 'color': '#10b981', 'tipo': 'operativo'},
    '56': {'id': 'mobiliario', 'nombre': 'Mobiliario y Equipamiento', 'icono': '🪑', 'color': '#d97706', 'tipo': 'inversion'},
    '70': {'id': 'servicios_agropecuarios', 'nombre': 'Servicios Agropecuarios y Animales', 'icono': '🌾', 'color': '#15803d', 'tipo': 'operativo'},
    '72': {'id': 'mantenimiento_servicios', 'nombre': 'Instalación y Mantenimiento', 'icono': '🛠️', 'color': '#ca8a04', 'tipo': 'operativo'},
    '78': {'id': 'transporte_fletes', 'nombre': 'Transporte, Fletes y Envíos', 'icono': '🚚', 'color': '#0284c7', 'tipo': 'operativo'},
    '80': {'id': 'servicios_profesionales', 'nombre': 'Servicios Profesionales y Asesoría', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '81': {'id': 'software_nube', 'nombre': 'Software, Nube y Telecomunicaciones', 'icono': '🌐', 'color': '#8b5cf6', 'tipo': 'operativo'},
    '82': {'id': 'publicidad', 'nombre': 'Publicidad y Mercadotecnia', 'icono': '📢', 'color': '#ec4899', 'tipo': 'operativo'},
    '84': {'id': 'servicios_financieros', 'nombre': 'Servicios Financieros, Banca y Seguros', 'icono': '🏦', 'color': '#6366f1', 'tipo': 'financiero'},
    '86': {'id': 'educacion', 'nombre': 'Capacitación y Educación', 'icono': '🎓', 'color': '#3b82f6', 'tipo': 'operativo'},
    '90': {'id': 'viaticos_restaurantes', 'nombre': 'Restaurantes, Hospedaje y Viáticos', 'icono': '☕', 'color': '#d97706', 'tipo': 'viaticos'},
    '95': {'id': 'casetas_peajes', 'nombre': 'Casetas, Peajes y Obras Civiles', 'icono': '🛣️', 'color': '#64748b', 'tipo': 'operativo'},
}

# ─── FAMILIAS UNSPSC (4 Dígitos) ───
TAXONOMIA_FAMILIAS: Dict[str, Dict[str, str]] = {
    '7012': {'id': 'veterinaria_animales', 'nombre': 'Servicios Veterinarios y Cuidado Animal', 'icono': '🐾', 'color': '#10b981', 'tipo': 'operativo'},
    '8013': {'id': 'arrendamiento_inmuebles', 'nombre': 'Renta de Inmuebles y Oficinas', 'icono': '🏢', 'color': '#15803d', 'tipo': 'operativo'},
    '7810': {'id': 'paqueteria_fletes', 'nombre': 'Paquetería, Mensajería y Fletes', 'icono': '📦', 'color': '#f59e0b', 'tipo': 'operativo'},
    '7811': {'id': 'transporte_pasajeros', 'nombre': 'Transporte y Movilidad', 'icono': '🚗', 'color': '#0284c7', 'tipo': 'operativo'},
    '7812': {'id': 'almacenamiento', 'nombre': 'Almacenamiento y Bodegas', 'icono': '🏭', 'color': '#71717a', 'tipo': 'operativo'},
    '8412': {'id': 'servicios_financieros', 'nombre': 'Servicios Bancarios y Crédito', 'icono': '🏦', 'color': '#6366f1', 'tipo': 'financiero'},
    '8413': {'id': 'seguros_polizas', 'nombre': 'Seguros y Fianzas', 'icono': '🛡️', 'color': '#0d9488', 'tipo': 'operativo'},
    '8411': {'id': 'contabilidad_facturacion', 'nombre': 'Contabilidad y Facturación', 'icono': '🧾', 'color': '#6366f1', 'tipo': 'operativo'},
    '8111': {'id': 'software_ti', 'nombre': 'Software, Nube y Servicios TI', 'icono': '🌐', 'color': '#8b5cf6', 'tipo': 'operativo'},
    '8014': {'id': 'servicios_comerciales', 'nombre': 'Comercialización y Ventas', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '8010': {'id': 'consultoria_gestion', 'nombre': 'Gestión de Empresas y Consultoría', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '4321': {'id': 'computo_hardware', 'nombre': 'Equipo de Cómputo y Laptops', 'icono': '💻', 'color': '#0ea5e9', 'tipo': 'inversion'},
    '4322': {'id': 'redes_telecom', 'nombre': 'Redes y Telecomunicaciones', 'icono': '📡', 'color': '#0284c7', 'tipo': 'operativo'},
    '4323': {'id': 'software_paquete', 'nombre': 'Software y Aplicaciones', 'icono': '💻', 'color': '#8b5cf6', 'tipo': 'operativo'},
    '9010': {'id': 'restaurantes', 'nombre': 'Restaurantes y Alimentos', 'icono': '🍽️', 'color': '#d97706', 'tipo': 'viaticos'},
    '9011': {'id': 'hoteles', 'nombre': 'Hoteles y Hospedaje', 'icono': '🏨', 'color': '#d97706', 'tipo': 'viaticos'},
    '1510': {'id': 'combustibles', 'nombre': 'Combustibles y Gasolinas', 'icono': '⛽', 'color': '#f97316', 'tipo': 'operativo'},
    '4412': {'id': 'papeleria', 'nombre': 'Papelería y Artículos de Oficina', 'icono': '📎', 'color': '#14b8a6', 'tipo': 'operativo'},
    '4410': {'id': 'equipos_oficina', 'nombre': 'Impresoras y Equipos de Oficina', 'icono': '🖨️', 'color': '#14b8a6', 'tipo': 'inversion'},
}

# ─── CLAVES ESPECÍFICAS SAT (8 Dígitos de Máxima Prioridad) ───
TAXONOMIA_CLAVES_ESPECIFICAS: Dict[str, Dict[str, str]] = {
    '78111502': {'id': 'vuelos_aviones', 'nombre': 'Boletos de Avión y Vuelos', 'icono': '✈️', 'color': '#0284c7', 'tipo': 'viaticos'},
    '78111500': {'id': 'vuelos_aviones', 'nombre': 'Boletos de Avión y Vuelos', 'icono': '✈️', 'color': '#0284c7', 'tipo': 'viaticos'},
    '78111811': {'id': 'arrendamiento_vehiculos', 'nombre': 'Arrendamiento de Vehículos (Leasing)', 'icono': '🚗', 'color': '#3b82f6', 'tipo': 'operativo'},
    '78111808': {'id': 'taxis_plataformas', 'nombre': 'Plataformas de Movilidad y Taxis', 'icono': '🚕', 'color': '#f59e0b', 'tipo': 'viaticos'},
    '78111804': {'id': 'taxis_plataformas', 'nombre': 'Plataformas de Movilidad y Taxis', 'icono': '🚕', 'color': '#f59e0b', 'tipo': 'viaticos'},
    '78111802': {'id': 'transporte_pasajeros', 'nombre': 'Transporte de Pasajeros y Autobuses', 'icono': '🚌', 'color': '#0284c7', 'tipo': 'viaticos'},
    '78102200': {'id': 'paqueteria_envios', 'nombre': 'Paquetería y Logística de Envíos', 'icono': '📦', 'color': '#f59e0b', 'tipo': 'operativo'},
    '78102205': {'id': 'mensajeria_entregas', 'nombre': 'Mensajería y Entregas Locales', 'icono': '🛵', 'color': '#f59e0b', 'tipo': 'operativo'},
    '78101802': {'id': 'fletes_envios', 'nombre': 'Fletes y Transporte de Carga', 'icono': '🚚', 'color': '#8b5cf6', 'tipo': 'operativo'},
    '95111602': {'id': 'casetas_peajes', 'nombre': 'Casetas, Peajes y Autopistas', 'icono': '🛣️', 'color': '#64748b', 'tipo': 'viaticos'},

    '70122009': {'id': 'veterinaria_animales', 'nombre': 'Servicios Veterinarios y Cuidado Animal', 'icono': '🐾', 'color': '#10b981', 'tipo': 'operativo'},
    '70122000': {'id': 'veterinaria_animales', 'nombre': 'Servicios Veterinarios y Cuidado Animal', 'icono': '🐾', 'color': '#10b981', 'tipo': 'operativo'},

    '80131502': {'id': 'arrendamiento_inmuebles', 'nombre': 'Renta de Inmuebles y Oficinas', 'icono': '🏢', 'color': '#15803d', 'tipo': 'operativo'},
    '80131500': {'id': 'arrendamiento_inmuebles', 'nombre': 'Renta de Inmuebles y Oficinas', 'icono': '🏢', 'color': '#15803d', 'tipo': 'operativo'},

    '80161505': {'id': 'seguros_polizas', 'nombre': 'Seguros y Fianzas', 'icono': '🛡️', 'color': '#0d9488', 'tipo': 'operativo'},
    '84131500': {'id': 'seguros_polizas', 'nombre': 'Seguros y Fianzas', 'icono': '🛡️', 'color': '#0d9488', 'tipo': 'operativo'},
    '84121500': {'id': 'servicios_financieros', 'nombre': 'Servicios Bancarios y Financieros', 'icono': '🏦', 'color': '#6366f1', 'tipo': 'financiero'},
    '84111506': {'id': 'servicios_facturacion', 'nombre': 'Servicios de Facturación y Finanzas', 'icono': '🧾', 'color': '#6366f1', 'tipo': 'operativo'},

    '15101514': {'id': 'combustibles', 'nombre': 'Combustibles y Gasolinas', 'icono': '⛽', 'color': '#f97316', 'tipo': 'operativo'},
    '15101515': {'id': 'combustibles', 'nombre': 'Combustibles y Gasolinas', 'icono': '⛽', 'color': '#f97316', 'tipo': 'operativo'},

    '80141600': {'id': 'servicios_profesionales', 'nombre': 'Servicios Profesionales y Asesoría', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '80101500': {'id': 'consultoria_gestion', 'nombre': 'Consultoría y Gestión de Negocios', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '81112200': {'id': 'software_saas', 'nombre': 'Software, Licencias y SaaS', 'icono': '💻', 'color': '#8b5cf6', 'tipo': 'operativo'},
    '81112000': {'id': 'servicios_nube', 'nombre': 'Hosting, Nube e Infraestructura TI', 'icono': '🌐', 'color': '#8b5cf6', 'tipo': 'operativo'},
    '43211500': {'id': 'computo_hardware', 'nombre': 'Equipo de Cómputo y Hardware', 'icono': '💻', 'color': '#0ea5e9', 'tipo': 'inversion'},
    '90101500': {'id': 'restaurantes_alimentos', 'nombre': 'Restaurantes y Alimentos', 'icono': '🍽️', 'color': '#d97706', 'tipo': 'viaticos'},
    '90111500': {'id': 'hoteles_hospedaje', 'nombre': 'Hoteles y Hospedaje', 'icono': '🏨', 'color': '#d97706', 'tipo': 'viaticos'},
}
