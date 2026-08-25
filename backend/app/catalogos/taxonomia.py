"""
Taxonomía Contable y Clasificación Ágil SAT (8 Rubros Esenciales)
Define la estructura simplificada de 8 categorías maestras para profesionistas
independientes, PFAE y freelancers, optimizando velocidad y experiencia de usuario.
"""

from typing import Dict, Any

# ─── SEGMENTOS UNSPSC (2 Dígitos) ───
TAXONOMIA_SEGMENTOS: Dict[str, Dict[str, str]] = {
    '15': {'id': 'combustibles', 'nombre': 'Combustibles y Lubricantes', 'icono': '⛽', 'color': '#f97316', 'tipo': 'operativo'},
    '25': {'id': 'renta_vehiculos', 'nombre': 'Renta de Vehículos y Autos', 'icono': '🚗', 'color': '#3b82f6', 'tipo': 'operativo'},
    '32': {'id': 'computo_hardware', 'nombre': 'Equipo de Cómputo y Electrónica', 'icono': '🖥️', 'color': '#0ea5e9', 'tipo': 'inversion'},
    '43': {'id': 'computo_hardware', 'nombre': 'Equipo de Cómputo y Electrónica', 'icono': '🖥️', 'color': '#0ea5e9', 'tipo': 'inversion'},
    '44': {'id': 'otros_operativos', 'nombre': 'Otros Gastos Operativos', 'icono': '📋', 'color': '#475569', 'tipo': 'operativo'},
    '50': {'id': 'otros_operativos', 'nombre': 'Otros Gastos Operativos', 'icono': '📋', 'color': '#475569', 'tipo': 'operativo'},
    '51': {'id': 'otros_operativos', 'nombre': 'Otros Gastos Operativos', 'icono': '📋', 'color': '#475569', 'tipo': 'operativo'},
    '70': {'id': 'otros_operativos', 'nombre': 'Otros Gastos Operativos', 'icono': '📋', 'color': '#475569', 'tipo': 'operativo'},
    '72': {'id': 'otros_operativos', 'nombre': 'Otros Gastos Operativos', 'icono': '📋', 'color': '#475569', 'tipo': 'operativo'},
    '78': {'id': 'viaticos_viajes', 'nombre': 'Viáticos, Viajes y Peajes', 'icono': '✈️', 'color': '#64748b', 'tipo': 'viaticos'},
    '80': {'id': 'servicios_profesionales', 'nombre': 'Servicios Profesionales y Asesoría', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '81': {'id': 'software_ti', 'nombre': 'Software, Nube e Infraestructura TI', 'icono': '💻', 'color': '#8b5cf6', 'tipo': 'operativo'},
    '82': {'id': 'servicios_profesionales', 'nombre': 'Servicios Profesionales y Asesoría', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '84': {'id': 'servicios_profesionales', 'nombre': 'Servicios Profesionales y Asesoría', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '86': {'id': 'servicios_profesionales', 'nombre': 'Servicios Profesionales y Asesoría', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '90': {'id': 'viaticos_viajes', 'nombre': 'Viáticos, Viajes y Peajes', 'icono': '✈️', 'color': '#64748b', 'tipo': 'viaticos'},
    '95': {'id': 'viaticos_viajes', 'nombre': 'Viáticos, Viajes y Peajes', 'icono': '✈️', 'color': '#64748b', 'tipo': 'viaticos'},
}

# ─── FAMILIAS UNSPSC (4 Dígitos) ───
TAXONOMIA_FAMILIAS: Dict[str, Dict[str, str]] = {
    '8111': {'id': 'software_ti', 'nombre': 'Software, Nube e Infraestructura TI', 'icono': '💻', 'color': '#8b5cf6', 'tipo': 'operativo'},
    '4323': {'id': 'software_ti', 'nombre': 'Software, Nube e Infraestructura TI', 'icono': '💻', 'color': '#8b5cf6', 'tipo': 'operativo'},
    '4321': {'id': 'computo_hardware', 'nombre': 'Equipo de Cómputo y Electrónica', 'icono': '🖥️', 'color': '#0ea5e9', 'tipo': 'inversion'},
    '4322': {'id': 'computo_hardware', 'nombre': 'Equipo de Cómputo y Electrónica', 'icono': '🖥️', 'color': '#0ea5e9', 'tipo': 'inversion'},
    '8010': {'id': 'servicios_profesionales', 'nombre': 'Servicios Profesionales y Asesoría', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '8012': {'id': 'servicios_profesionales', 'nombre': 'Servicios Profesionales y Asesoría', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '8014': {'id': 'servicios_profesionales', 'nombre': 'Servicios Profesionales y Asesoría', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '8411': {'id': 'servicios_profesionales', 'nombre': 'Servicios Profesionales y Asesoría', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '8412': {'id': 'servicios_profesionales', 'nombre': 'Servicios Profesionales y Asesoría', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '8413': {'id': 'seguros_polizas', 'nombre': 'Seguros y Fianzas', 'icono': '🛡️', 'color': '#0d9488', 'tipo': 'operativo'},
    '1510': {'id': 'combustibles', 'nombre': 'Combustibles y Lubricantes', 'icono': '⛽', 'color': '#f97316', 'tipo': 'operativo'},
    '7811': {'id': 'renta_vehiculos', 'nombre': 'Renta de Vehículos y Autos', 'icono': '🚗', 'color': '#3b82f6', 'tipo': 'operativo'},
    '7810': {'id': 'otros_operativos', 'nombre': 'Otros Gastos Operativos', 'icono': '📋', 'color': '#475569', 'tipo': 'operativo'},
    '9010': {'id': 'viaticos_viajes', 'nombre': 'Viáticos, Viajes y Peajes', 'icono': '✈️', 'color': '#64748b', 'tipo': 'viaticos'},
    '9011': {'id': 'viaticos_viajes', 'nombre': 'Viáticos, Viajes y Peajes', 'icono': '✈️', 'color': '#64748b', 'tipo': 'viaticos'},
    '4412': {'id': 'otros_operativos', 'nombre': 'Otros Gastos Operativos', 'icono': '📋', 'color': '#475569', 'tipo': 'operativo'},
}

# ─── CLAVES ESPECÍFICAS SAT (8 Dígitos de Máxima Prioridad) ───
TAXONOMIA_CLAVES_ESPECIFICAS: Dict[str, Dict[str, str]] = {
    # 1. Software y Cloud
    '81112200': {'id': 'software_ti', 'nombre': 'Software, Nube e Infraestructura TI', 'icono': '💻', 'color': '#8b5cf6', 'tipo': 'operativo'},
    '81112000': {'id': 'software_ti', 'nombre': 'Software, Nube e Infraestructura TI', 'icono': '💻', 'color': '#8b5cf6', 'tipo': 'operativo'},
    '81112105': {'id': 'software_ti', 'nombre': 'Software, Nube e Infraestructura TI', 'icono': '💻', 'color': '#8b5cf6', 'tipo': 'operativo'},
    '81111508': {'id': 'software_ti', 'nombre': 'Software, Nube e Infraestructura TI', 'icono': '💻', 'color': '#8b5cf6', 'tipo': 'operativo'},

    # 2. Equipo de Cómputo y Electrónica
    '43211500': {'id': 'computo_hardware', 'nombre': 'Equipo de Cómputo y Electrónica', 'icono': '🖥️', 'color': '#0ea5e9', 'tipo': 'inversion'},
    '43211503': {'id': 'computo_hardware', 'nombre': 'Equipo de Cómputo y Electrónica', 'icono': '🖥️', 'color': '#0ea5e9', 'tipo': 'inversion'},
    '81112306': {'id': 'computo_hardware', 'nombre': 'Equipo de Cómputo y Electrónica', 'icono': '🖥️', 'color': '#0ea5e9', 'tipo': 'inversion'},

    # 3. Servicios Profesionales y Asesoría
    '80101500': {'id': 'servicios_profesionales', 'nombre': 'Servicios Profesionales y Asesoría', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '80141600': {'id': 'servicios_profesionales', 'nombre': 'Servicios Profesionales y Asesoría', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '84111506': {'id': 'servicios_profesionales', 'nombre': 'Servicios Profesionales y Asesoría', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '84121500': {'id': 'servicios_profesionales', 'nombre': 'Servicios Profesionales y Asesoría', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},

    # 4. Renta de Vehículos
    '78111811': {'id': 'renta_vehiculos', 'nombre': 'Renta de Vehículos y Autos', 'icono': '🚗', 'color': '#3b82f6', 'tipo': 'operativo'},

    # 5. Movilidad y Taxis
    '78111808': {'id': 'movilidad_taxis', 'nombre': 'Plataformas de Movilidad y Taxis', 'icono': '🚖', 'color': '#eab308', 'tipo': 'viaticos'},
    '78111804': {'id': 'movilidad_taxis', 'nombre': 'Plataformas de Movilidad y Taxis', 'icono': '🚖', 'color': '#eab308', 'tipo': 'viaticos'},

    # 6. Combustibles
    '15101514': {'id': 'combustibles', 'nombre': 'Combustibles y Lubricantes', 'icono': '⛽', 'color': '#f97316', 'tipo': 'operativo'},
    '15101515': {'id': 'combustibles', 'nombre': 'Combustibles y Lubricantes', 'icono': '⛽', 'color': '#f97316', 'tipo': 'operativo'},

    # 7. Seguros
    '80161505': {'id': 'seguros_polizas', 'nombre': 'Seguros y Fianzas', 'icono': '🛡️', 'color': '#0d9488', 'tipo': 'operativo'},
    '84131500': {'id': 'seguros_polizas', 'nombre': 'Seguros y Fianzas', 'icono': '🛡️', 'color': '#0d9488', 'tipo': 'operativo'},

    # 8. Viáticos, Viajes y Peajes
    '95111602': {'id': 'viaticos_viajes', 'nombre': 'Viáticos, Viajes y Peajes', 'icono': '✈️', 'color': '#64748b', 'tipo': 'viaticos'},
    '78111502': {'id': 'viaticos_viajes', 'nombre': 'Viáticos, Viajes y Peajes', 'icono': '✈️', 'color': '#64748b', 'tipo': 'viaticos'},
    '78111500': {'id': 'viaticos_viajes', 'nombre': 'Viáticos, Viajes y Peajes', 'icono': '✈️', 'color': '#64748b', 'tipo': 'viaticos'},
    '90101500': {'id': 'viaticos_viajes', 'nombre': 'Viáticos, Viajes y Peajes', 'icono': '✈️', 'color': '#64748b', 'tipo': 'viaticos'},
    '90111500': {'id': 'viaticos_viajes', 'nombre': 'Viáticos, Viajes y Peajes', 'icono': '✈️', 'color': '#64748b', 'tipo': 'viaticos'},
}
