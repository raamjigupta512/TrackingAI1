import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'es' | 'zh' | 'de' | 'da';

export interface LanguageInfo {
  code: Language;
  label: string;
  flag: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'da', label: 'Dansk', flag: '🇩🇰' },
];

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Sidebar & Profile
    'overview': 'Overview',
    'bookings': 'Bookings',
    'maersk_ai': 'Maersk AI',
    'rule_engine': 'Rule Engine',
    'light': 'Light',
    'dark': 'Dark',
    'logout': 'Log Out',
    'global_hub': 'Global Hub',
    'active_profile': 'Active Profile',
    'customer': 'Customer',
    'agent': 'Agent',
    
    // Welcome & Headers
    'welcome_back': 'Welcome back',
    'all_shipments_title': 'All Shipments',
    'shipment_tracking_title': 'Shipment Tracking',
    'dashboard_desc': 'Your logistics overview for today as a',
    'shipments_desc': 'Manage and monitor your ongoing bookings.',
    'tracking_desc': 'Detailed status for',
    'assistant_desc': 'AI-powered support for your supply chain.',
    'rules_desc': 'Design and deploy automated logistics rules.',

    // Stats
    'global_bookings': 'Global Bookings',
    'air_sea_transit': 'Air & Sea Transit',
    'completed': 'Completed',
    'alerts': 'Alerts',
    'access_level': 'Access Level',
    'active_system_permissions': 'Active System Permissions',

    // Dashboard & ShipmentList
    'all_shipments': 'All Shipments',
    'search_placeholder': 'Search booking, vessel, ports...',
    'status': 'Status',
    'origin': 'Place of Origin',
    'destination': 'Place of Destination',
    'eta': 'Est. Arrival',
    'est_date_of_departure': 'Est. Date of Departure',
    'estimate_date_of_arrival': 'Estimate Date of Arrival',
    'search': 'Search',
    'filter_all': 'All Statuses',
    'live_shipments': 'Live Shipments',
    'booking_no_label': 'Booking No',
    'shipment_no_label': 'Shipment No',
    'affected_shipment': 'Affected Shipment',
    'affected_by_routing_rule': 'Affected by Routing Rule',
    'reason_label': 'Reason',
    'delay_factor': 'Delay Factor',
    'evaluated_label': 'Evaluated',
    'track_shipment': 'Track Shipment',
    'cargo_weight': 'Cargo Weight',
    'containers': 'Containers',
    'contents': 'Contents',
    'export_csv': 'Export CSV',

    // Affected Banner
    'automated_routing_rules_applied': 'Automated Routing Rules Applied',
    'maersk_routing_engine_detected_part1': 'The Maersk Routing Engine has detected',
    'maersk_routing_engine_detected_part2_singular': 'shipment currently delayed or rerouted due to active logistics policy triggers.',
    'maersk_routing_engine_detected_part2_plural': 'shipments currently delayed or rerouted due to active logistics policy triggers.',
    'viewing_affected_only': 'Viewing Affected Only',
    'filter_affected_shipments': 'Filter Affected Shipments',

    // Shipment Statuses
    'status_all': 'All',
    'status_at_sea': 'At Sea',
    'status_delivered': 'Delivered',
    'status_delayed': 'Delayed',
    'status_exception': 'Exception',
    'status_loading': 'Loading',
    'status_out_for_delivery': 'Out for Delivery',
    'status_customs_clearance': 'Customs Clearance',
    'status_awaiting_customs': 'Awaiting Customs',
    'status_affected': 'Affected',

    // Disruption Bar
    'disruption_alert': 'Disruption Alert',
    'automation_policy': 'Automation Policy',
    'impact_label': 'Impact',

    // Tracking Detail & Manifest
    'manifest_details': 'Manifest Details',
    'carrier': 'Carrier',
    'gross_weight': 'Gross Weight',
    'est_delivery': 'Est. Delivery Date',
    'service_level': 'Service Level',
    'notify_me': 'Notify Me',
    'alert_delay': 'Alert on Delay/Delivered',
    'update_records': 'Update Records',
    'port_loading': 'Port of Loading',
    'port_discharge': 'Port of Discharge',
    'share_status': 'Share Status',
    'copied': 'Copied',
    'current_status': 'Current Status',
    'voyage_log': 'Chronological Voyage Log',
    'voyage_log_desc': 'Complete history of vessel milestones and harbor telemetry',
    'utc_logged': 'UTC Logged',
    'update_shipment_title': 'Update Shipment Records',
    'shipment_status': 'Shipment Status',
    'contents_description': 'Contents / Load description',
    'container_count': 'Container Count',
    'cancel': 'Cancel',
    'save_updates': 'Save Updates',
    'route_tracking': 'Route Tracking & Telemetry',

    // Carbon Footprint
    'decarbonization_analytics': 'Decarbonization & CO2 Analytics',
    'ghg_protocol_tracking': 'Standard GHG protocol emissions tracking for Maersk Line voyage',
    'verified_climate_data': 'Verified Climate Data',
    'calculated_route': 'Calculated Route Distance',
    'total_weight': 'Total Weight',
    'estimated_co2': 'Estimated CO₂ Emissions',
    'biofuel_active': 'Biofuel emission reduction active (-85%)',
    'glec_info': 'Based on GLEC Framework. Actual emissions may vary with vessel size, payload, and fuel specification.',
    'maersk_eco_delivery': 'Maersk ECO Delivery',
    'biofuel_sub_header': 'Sustainable Second-Gen Biofuel',
    'biofuel_description': 'Switch this shipment to Maersk ECO Delivery to replace fossil fuel with certified green biofuel. Saves approximately 85% of standard carbon output.',
    'certificate_issued': 'CO2 Offset Certificate Issued',
    'saved_carbon': 'Saved Carbon',
    'select_biofuel_desc': 'Select biofuel to reduce environmental impact',
    'voyage_mode_comparison': 'Voyage Mode Comparison (Total CO₂ Emission)',
    'ocean_voyage': 'Ocean (Maersk Voyage)',
    'intermodal_rail': 'Intermodal Rail',
    'overland_road': 'Overland Road',
    'express_air': 'Express Air Freight',
    'current_mode': 'Current',
  },
  es: {
    // Sidebar & Profile
    'overview': 'Resumen',
    'bookings': 'Reservas',
    'maersk_ai': 'Maersk AI',
    'rule_engine': 'Motor de Reglas',
    'light': 'Claro',
    'dark': 'Oscuro',
    'logout': 'Cerrar Sesión',
    'global_hub': 'Centro Global',
    'active_profile': 'Perfil Activo',
    'customer': 'Cliente',
    'agent': 'Agente',

    // Welcome & Headers
    'welcome_back': 'Bienvenido de nuevo',
    'all_shipments_title': 'Todos los Envíos',
    'shipment_tracking_title': 'Seguimiento de Envíos',
    'dashboard_desc': 'Su resumen de logística para hoy como',
    'shipments_desc': 'Administre y supervise sus reservas en curso.',
    'tracking_desc': 'Estado detallado para',
    'assistant_desc': 'Soporte impulsado por IA para su cadena de suministro.',
    'rules_desc': 'Diseñe e implemente reglas logísticas automatizadas.',

    // Stats
    'global_bookings': 'Reservas Globales',
    'air_sea_transit': 'Tránsito Aéreo/Marítimo',
    'completed': 'Completado',
    'alerts': 'Alertas',
    'access_level': 'Nivel de Acceso',
    'active_system_permissions': 'Permisos de Sistema Activos',

    // Dashboard & ShipmentList
    'all_shipments': 'Todos los Envíos',
    'search_placeholder': 'Buscar reserva, barco, puertos...',
    'status': 'Estado',
    'origin': 'Lugar de Origen',
    'destination': 'Lugar de Destino',
    'eta': 'Llegada Est.',
    'est_date_of_departure': 'Fecha Est. de Salida',
    'estimate_date_of_arrival': 'Fecha de Llegada Estimada',
    'search': 'Buscar',
    'filter_all': 'Todos los Estados',
    'live_shipments': 'Envíos en Vivo',
    'booking_no_label': 'Nº de Reserva',
    'shipment_no_label': 'Nº de Envío',
    'affected_shipment': 'Envío Afectado',
    'affected_by_routing_rule': 'Afectado por Regla de Enrutamiento',
    'reason_label': 'Motivo',
    'delay_factor': 'Factor de Retraso',
    'evaluated_label': 'Evaluado',
    'track_shipment': 'Rastrear Envío',
    'cargo_weight': 'Peso de la Carga',
    'containers': 'Contenedores',
    'contents': 'Contenido',
    'export_csv': 'Exportar CSV',

    // Affected Banner
    'automated_routing_rules_applied': 'Reglas de Enrutamiento Automatizadas Aplicadas',
    'maersk_routing_engine_detected_part1': 'El motor de enrutamiento de Maersk ha detectado',
    'maersk_routing_engine_detected_part2_singular': 'envío actualmente retrasado o desviado debido a activadores de políticas de logística activas.',
    'maersk_routing_engine_detected_part2_plural': 'envíos actualmente retrasados o desviados debido a activadores de políticas de logística activas.',
    'viewing_affected_only': 'Viendo Solo Afectados',
    'filter_affected_shipments': 'Filtrar Envíos Afectados',

    // Shipment Statuses
    'status_all': 'Todos',
    'status_at_sea': 'En Alta Mar',
    'status_delivered': 'Entregado',
    'status_delayed': 'Demorado',
    'status_exception': 'Excepción',
    'status_loading': 'Cargando',
    'status_out_for_delivery': 'En Reparto',
    'status_customs_clearance': 'Despacho de Aduana',
    'status_awaiting_customs': 'Esperando Aduana',
    'status_affected': 'Afectado',

    // Disruption Bar
    'disruption_alert': 'Alerta de Interrupción',
    'automation_policy': 'Política Automatizada',
    'impact_label': 'Impacto',

    // Tracking Detail & Manifest
    'manifest_details': 'Detalles del Manifiesto',
    'carrier': 'Transportista',
    'gross_weight': 'Peso Bruto',
    'est_delivery': 'Fecha Est. de Entrega',
    'service_level': 'Nivel de Servicio',
    'notify_me': 'Notificarme',
    'alert_delay': 'Alerta en Demora/Entregado',
    'update_records': 'Actualizar Registros',
    'port_loading': 'Puerto de Carga',
    'port_discharge': 'Puerto de Descarga',
    'share_status': 'Compartir Estado',
    'copied': 'Copiado',
    'current_status': 'Estado Actual',
    'voyage_log': 'Bitácora Cronológica de Viaje',
    'voyage_log_desc': 'Historial completo de hitos del barco y telemetría portuaria',
    'utc_logged': 'Registrado UTC',
    'update_shipment_title': 'Actualizar Registros de Envío',
    'shipment_status': 'Estado del Envío',
    'contents_description': 'Descripción del Contenido / Carga',
    'container_count': 'Cantidad de Contenedores',
    'cancel': 'Cancelar',
    'save_updates': 'Guardar Cambios',
    'route_tracking': 'Seguimiento de Ruta y Telemetría',

    // Carbon Footprint
    'decarbonization_analytics': 'Descarbonización y Análisis de CO₂',
    'ghg_protocol_tracking': 'Seguimiento estándar de emisiones del protocolo GHG para el viaje de Maersk Line',
    'verified_climate_data': 'Datos Climáticos Verificados',
    'calculated_route': 'Distancia de Ruta Calculada',
    'total_weight': 'Peso Total',
    'estimated_co2': 'Emisiones de CO₂ Estimadas',
    'biofuel_active': 'Reducción de emisiones por biocombustible activa (-85%)',
    'glec_info': 'Basado en el marco GLEC. Las emisiones reales pueden variar según el tamaño del barco, la carga útil y la especificación del combustible.',
    'maersk_eco_delivery': 'Entrega Maersk ECO',
    'biofuel_sub_header': 'Biocombustible Sostenible de 2da Gen',
    'biofuel_description': 'Cambie este envío a Maersk ECO Delivery para reemplazar el combustible fósil con biocombustible ecológico certificado. Ahorra aproximadamente el 85% de las emisiones de carbono estándar.',
    'certificate_issued': 'Certificado de Compensación de CO2 Emitido',
    'saved_carbon': 'Carbono Ahorrado',
    'select_biofuel_desc': 'Seleccione biocombustible para reducir el impacto ambiental',
    'voyage_mode_comparison': 'Comparación del Modo de Viaje (Emisión Total de CO₂)',
    'ocean_voyage': 'Océano (Viaje Maersk)',
    'intermodal_rail': 'Ferrocarril Intermodal',
    'overland_road': 'Carretera Terrestre',
    'express_air': 'Flete Aéreo Express',
    'current_mode': 'Actual',
  },
  zh: {
    // Sidebar & Profile
    'overview': '概览',
    'bookings': '舱位预订',
    'maersk_ai': '马士基 AI',
    'rule_engine': '规则引擎',
    'light': '浅色',
    'dark': '深色',
    'logout': '退出登录',
    'global_hub': '全球枢纽',
    'active_profile': '活跃账户',
    'customer': '客户',
    'agent': '代理操作员',

    // Welcome & Headers
    'welcome_back': '欢迎回来',
    'all_shipments_title': '所有集装箱货运',
    'shipment_tracking_title': '货运追踪与遥测',
    'dashboard_desc': '您今天的物流概览，当前登录身份：',
    'shipments_desc': '管理和监控您进行中的舱位与货运。',
    'tracking_desc': '当前箱号的详细状态：',
    'assistant_desc': 'AI 驱动的智能供应链支持中心。',
    'rules_desc': '设计、测试并部署智能自动化物流规则。',

    // Stats
    'global_bookings': '全球预订总数',
    'air_sea_transit': '海空运输中',
    'completed': '已送达完成',
    'alerts': '异常与延误',
    'access_level': '系统访问级别',
    'active_system_permissions': '生效的系统操作权限',

    // Dashboard & ShipmentList
    'all_shipments': '所有集装箱',
    'search_placeholder': '搜索预订编号、船舶、港口...',
    'status': '状态',
    'origin': '起运港口',
    'destination': '目的港口',
    'eta': '预计到达时间',
    'est_date_of_departure': '预计出发时间',
    'estimate_date_of_arrival': '预计到达时间',
    'search': '搜索',
    'filter_all': '所有状态',
    'live_shipments': '实时货运动态',
    'booking_no_label': '预订编号',
    'shipment_no_label': '货运箱号',
    'affected_shipment': '受规则影响货运',
    'affected_by_routing_rule': '受自动化路由规则影响',
    'reason_label': '受控原因',
    'delay_factor': '预计延误时长',
    'evaluated_label': '规则评估时间',
    'track_shipment': '追踪该货运',
    'cargo_weight': '货物重量',
    'containers': '集装箱量',
    'contents': '装载内容',
    'export_csv': '导出 CSV 表格',

    // Affected Banner
    'automated_routing_rules_applied': '自动化规则已触发',
    'maersk_routing_engine_detected_part1': '马士基智能路由引擎已检测到',
    'maersk_routing_engine_detected_part2_singular': '批集装箱正因处于生效状态的供应链保障规则而发生延误或路径重算。',
    'maersk_routing_engine_detected_part2_plural': '批集装箱正因处于生效状态的供应链保障规则而发生延误或路径重算。',
    'viewing_affected_only': '正在过滤：仅受规则影响的货运',
    'filter_affected_shipments': '筛选受影响的货运',

    // Shipment Statuses
    'status_all': '全部',
    'status_at_sea': '航行中',
    'status_delivered': '已送达',
    'status_delayed': '延误中',
    'status_exception': '异常警报',
    'status_loading': '装货中',
    'status_out_for_delivery': '派送中',
    'status_customs_clearance': '清关中',
    'status_awaiting_customs': '等待清关',
    'status_affected': '受控中',

    // Disruption Bar
    'disruption_alert': '航路受阻警报',
    'automation_policy': '自动执行策略',
    'impact_label': '受波及程度',

    // Tracking Detail & Manifest
    'manifest_details': '舱单详情',
    'carrier': '承运商',
    'gross_weight': '货物总重',
    'est_delivery': '预计送达日期',
    'service_level': '服务等级',
    'notify_me': '接收通知',
    'alert_delay': '延误/送达时通知我',
    'update_records': '更新货运记录',
    'port_loading': '起运港 (装货港)',
    'port_discharge': '目的港 (卸货港)',
    'share_status': '共享货运状态',
    'copied': '已复制到剪贴板',
    'current_status': '当前货运状态',
    'voyage_log': '航程历史日志',
    'voyage_log_desc': '船舶里程碑和港口电报数据的完整历史记录',
    'utc_logged': 'UTC 记录时间',
    'update_shipment_title': '更新货运记录',
    'shipment_status': '货运状态',
    'contents_description': '货物内容/装载描述',
    'container_count': '集装箱数量',
    'cancel': '取消',
    'save_updates': '保存更新',
    'route_tracking': '航线追踪与遥测',

    // Carbon Footprint
    'decarbonization_analytics': '脱碳与二氧化碳分析',
    'ghg_protocol_tracking': '马士基航线温室气体核算协议标准排放追踪',
    'verified_climate_data': '经认证的气候数据',
    'calculated_route': '计算航线距离',
    'total_weight': '货物总重量',
    'estimated_co2': '预计二氧化碳排放量',
    'biofuel_active': '生物燃料碳减排已启用 (-85%)',
    'glec_info': '基于 GLEC 框架。实际排放量可能因船舶大小、载重量和燃料规格而异。',
    'maersk_eco_delivery': '马士基环保运输 (ECO Delivery)',
    'biofuel_sub_header': '可持续第二代生物燃料',
    'biofuel_description': '将此货运切换为马士基 ECO 运输，使用经认证的绿色生物燃料替代化石燃料。可减少约85%的标准碳排放。',
    'certificate_issued': '已颁发二氧化碳抵消证书',
    'saved_carbon': '已减排碳量',
    'select_biofuel_desc': '选择生物燃料以减少环境影响',
    'voyage_mode_comparison': '运输模式对比 (二氧化碳总排放量)',
    'ocean_voyage': '海洋运输 (马士基航线)',
    'intermodal_rail': '多式联运铁路',
    'overland_road': '陆路公路运输',
    'express_air': '航空快递货运',
    'current_mode': '当前模式',
  },
  de: {
    // Sidebar & Profile
    'overview': 'Übersicht',
    'bookings': 'Buchungen',
    'maersk_ai': 'Maersk KI',
    'rule_engine': 'Regel-Engine',
    'light': 'Hell',
    'dark': 'Dunkel',
    'logout': 'Abmelden',
    'global_hub': 'Globales Hub',
    'active_profile': 'Aktives Profil',
    'customer': 'Kunde',
    'agent': 'Agent',

    // Welcome & Headers
    'welcome_back': 'Willkommen zurück',
    'all_shipments_title': 'Alle Sendungen',
    'shipment_tracking_title': 'Sendungsverfolgung',
    'dashboard_desc': 'Ihre Logistikübersicht für heute als',
    'shipments_desc': 'Verwalten und überwachen Sie Ihre laufenden Buchungen.',
    'tracking_desc': 'Detaillierter Status für',
    'assistant_desc': 'KI-gestützte Unterstützung für Ihre Lieferkette.',
    'rules_desc': 'Entwerfen und implementieren Sie automatisierte Logistikregeln.',

    // Stats
    'global_bookings': 'Globale Buchungen',
    'air_sea_transit': 'Luft- & Seetransit',
    'completed': 'Abgeschlossen',
    'alerts': 'Warnungen',
    'access_level': 'Zugriffsebene',
    'active_system_permissions': 'Aktive Systemberechtigungen',

    // Dashboard & ShipmentList
    'all_shipments': 'Alle Sendungen',
    'search_placeholder': 'Suche Buchung, Schiff, Häfen...',
    'status': 'Status',
    'origin': 'Ort der Herkunft',
    'destination': 'Ort des Zielorts',
    'eta': 'Erwartete Ankunft',
    'est_date_of_departure': 'Voraussichtliches Abreisedatum',
    'estimate_date_of_arrival': 'Voraussichtliches Ankunftsdatum',
    'search': 'Suchen',
    'filter_all': 'Alle Status',
    'live_shipments': 'Live-Sendungen',
    'booking_no_label': 'Buchungs-Nr.',
    'shipment_no_label': 'Sendungs-Nr.',
    'affected_shipment': 'Betroffene Sendung',
    'affected_by_routing_rule': 'Betroffen von Routing-Regel',
    'reason_label': 'Grund',
    'delay_factor': 'Verzögerungsfaktor',
    'evaluated_label': 'Ausgewertet',
    'track_shipment': 'Sendung verfolgen',
    'cargo_weight': 'Frachtgewicht',
    'containers': 'Container',
    'contents': 'Inhalt',
    'export_csv': 'CSV exportieren',

    // Affected Banner
    'automated_routing_rules_applied': 'Automatisierte Routing-Regeln angewendet',
    'maersk_routing_engine_detected_part1': 'Die Maersk Routing-Engine hat',
    'maersk_routing_engine_detected_part2_singular': 'Sendung identifiziert, die aufgrund aktiver Logistikrichtlinien-Trigger verzögert oder umgeleitet wurde.',
    'maersk_routing_engine_detected_part2_plural': 'Sendungen identifiziert, die aufgrund aktiver Logistikrichtlinien-Trigger verzögert oder umgeleitet wurden.',
    'viewing_affected_only': 'Nur betroffene anzeigen',
    'filter_affected_shipments': 'Betroffene Sendungen filtern',

    // Shipment Statuses
    'status_all': 'Alle',
    'status_at_sea': 'Auf See',
    'status_delivered': 'Geliefert',
    'status_delayed': 'Verspätet',
    'status_exception': 'Ausnahme',
    'status_loading': 'Verladen',
    'status_out_for_delivery': 'In Zustellung',
    'status_customs_clearance': 'Zollabfertigung',
    'status_awaiting_customs': 'Warten auf den Zoll',
    'status_affected': 'Betroffen',

    // Disruption Bar
    'disruption_alert': 'Störungsmeldung',
    'automation_policy': 'Automatisierungsrichtlinie',
    'impact_label': 'Auswirkung',

    // Tracking Detail & Manifest
    'manifest_details': 'Manifest-Details',
    'carrier': 'Frachtführer',
    'gross_weight': 'Bruttogewicht',
    'est_delivery': 'Erwartetes Lieferdatum',
    'service_level': 'Service-Level',
    'notify_me': 'Benachrichtigen Sie mich',
    'alert_delay': 'Benachrichtigung bei Verspätung/Zustellung',
    'update_records': 'Daten aktualisieren',
    'port_loading': 'Verladehafen',
    'port_discharge': 'Entladehafen',
    'share_status': 'Status teilen',
    'copied': 'Kopiert',
    'current_status': 'Aktueller Status',
    'voyage_log': 'Chronologisches Reiseprotokoll',
    'voyage_log_desc': 'Vollständige Historie der Meilensteine des Schiffes und der Hafentelemetrie',
    'utc_logged': 'UTC Protokolliert',
    'update_shipment_title': 'Sendungsdaten aktualisieren',
    'shipment_status': 'Sendungsstatus',
    'contents_description': 'Inhalt / Ladungsbeschreibung',
    'container_count': 'Anzahl Container',
    'cancel': 'Abbrechen',
    'save_updates': 'Änderungen speichern',
    'route_tracking': 'Routenverfolgung & Telemetrie',

    // Carbon Footprint
    'decarbonization_analytics': 'Dekarbonisierung & CO₂-Analyse',
    'ghg_protocol_tracking': 'Standard-GHG-Protokoll-Emissionsverfolgung für die Maersk Line-Reise',
    'verified_climate_data': 'Verifizierte Klimadaten',
    'calculated_route': 'Berechnete Routenentfernung',
    'total_weight': 'Gesamtgewicht',
    'estimated_co2': 'Geschätzte CO₂-Emissionen',
    'biofuel_active': 'Biokraftstoff-Emissionsreduzierung aktiv (-85%)',
    'glec_info': 'Basierend auf dem GLEC-Framework. Die tatsächlichen Emissionen können je nach Schiffsgröße, Nutzlast und Kraftstoffspezifikation variieren.',
    'maersk_eco_delivery': 'Maersk ECO Delivery',
    'biofuel_sub_header': 'Nachhaltiger Biokraftstoff der 2. Gen',
    'biofuel_description': 'Stellen Sie diese Sendung auf Maersk ECO Delivery um, um fossilen Brennstoff durch zertifizierten grünen Biokraftstoff zu ersetzen. Spart ca. 85 % des Standard-CO₂-Ausstoßes.',
    'certificate_issued': 'CO2-Kompensationszertifikat ausgestellt',
    'saved_carbon': 'Eingespartes CO₂',
    'select_biofuel_desc': 'Biokraftstoff auswählen, um die Umweltbelastung zu reduzieren',
    'voyage_mode_comparison': 'Reisemodus-Vergleich (Gesamt-CO₂-Emission)',
    'ocean_voyage': 'Ozean (Maersk-Reise)',
    'intermodal_rail': 'Intermodale Schiene',
    'overland_road': 'Überlandstraße',
    'express_air': 'Express-Luftfracht',
    'current_mode': 'Aktuell',
  },
  da: {
    // Sidebar & Profile
    'overview': 'Oversigt',
    'bookings': 'Bookinger',
    'maersk_ai': 'Maersk AI',
    'rule_engine': 'Regelmotor',
    'light': 'Lys',
    'dark': 'Mørk',
    'logout': 'Log ud',
    'global_hub': 'Global Hub',
    'active_profile': 'Aktiv profil',
    'customer': 'Kunde',
    'agent': 'Agent',

    // Welcome & Headers
    'welcome_back': 'Velkommen tilbage',
    'all_shipments_title': 'Alle forsendelser',
    'shipment_tracking_title': 'Forsendelsessporing',
    'dashboard_desc': 'Din logistikoversigt for i dag som',
    'shipments_desc': 'Administrer og overvåg dine igangværende bookinger.',
    'tracking_desc': 'Detaljeret status for',
    'assistant_desc': 'AI-drevet support til din forsyningskæde.',
    'rules_desc': 'Design og udrul automatiserede logistikregler.',

    // Stats
    'global_bookings': 'Globale bookinger',
    'air_sea_transit': 'Luft- og søtransport',
    'completed': 'Gennemført',
    'alerts': 'Alarmer',
    'access_level': 'Adgangsniveau',
    'active_system_permissions': 'Aktive systemtilladelser',

    // Dashboard & ShipmentList
    'all_shipments': 'Alle forsendelser',
    'search_placeholder': 'Søg booking, skib, havne...',
    'status': 'Status',
    'origin': 'Afgangssted',
    'destination': 'Destinationssted',
    'eta': 'Forventet ankomst',
    'est_date_of_departure': 'Forventet afgangsdato',
    'estimate_date_of_arrival': 'Forventet ankomstdato',
    'search': 'Søg',
    'filter_all': 'Alle statusser',
    'live_shipments': 'Live-forsendelser',
    'booking_no_label': 'Booking nr.',
    'shipment_no_label': 'Forsendelses nr.',
    'affected_shipment': 'Berørt forsendelse',
    'affected_by_routing_rule': 'Berørt af ruteringsregel',
    'reason_label': 'Årsag',
    'delay_factor': 'Forsinkelsesfaktor',
    'evaluated_label': 'Evalueret',
    'track_shipment': 'Spor forsendelse',
    'cargo_weight': 'Lastvægt',
    'containers': 'Containere',
    'contents': 'Indhold',
    'export_csv': 'Eksporter CSV',

    // Affected Banner
    'automated_routing_rules_applied': 'Automatiserede ruteringsregler anvendt',
    'maersk_routing_engine_detected_part1': 'Maersk Ruteringsmotor har registreret',
    'maersk_routing_engine_detected_part2_singular': 'forsendelse, der i øjeblikket er forsinket eller omdirigeret på grund af aktive logistikpolitikudløsere.',
    'maersk_routing_engine_detected_part2_plural': 'forsendelser, der i øjeblikket er forsinket eller omdirigeret på grund af aktive logistikpolitikudløsere.',
    'viewing_affected_only': 'Viser kun berørte',
    'filter_affected_shipments': 'Filtrer berørte forsendelser',

    // Shipment Statuses
    'status_all': 'Alle',
    'status_at_sea': 'Til søs',
    'status_delivered': 'Leveret',
    'status_delayed': 'Forsinket',
    'status_exception': 'Fejl',
    'status_loading': 'Indlæser',
    'status_out_for_delivery': 'Ude til levering',
    'status_customs_clearance': 'Toldbehandling',
    'status_awaiting_customs': 'Afventer told',
    'status_affected': 'Berørt',

    // Disruption Bar
    'disruption_alert': 'Driftsforstyrrelsesalarm',
    'automation_policy': 'Automationspolitik',
    'impact_label': 'Påvirkning',

    // Tracking Detail & Manifest
    'manifest_details': 'Manifestdetaljer',
    'carrier': 'Transportør',
    'gross_weight': 'Bruttovægt',
    'est_delivery': 'Forventet leveringsdato',
    'service_level': 'Serviceniveau',
    'notify_me': 'Giv mig besked',
    'alert_delay': 'Besked ved forsinkelse/levering',
    'update_records': 'Opdater data',
    'port_loading': 'Afgangshavn',
    'port_discharge': 'Ankomsthavn',
    'share_status': 'Del status',
    'copied': 'Kopieret',
    'current_status': 'Nuværende status',
    'voyage_log': 'Kronologisk rejselog',
    'voyage_log_desc': 'Komplet historik over skibets milepæle og havnetelemetri',
    'utc_logged': 'UTC Logget',
    'update_shipment_title': 'Opdater forsendelsesdata',
    'shipment_status': 'Forsendelsesstatus',
    'contents_description': 'Indholdsbeskrivelse',
    'container_count': 'Antal containere',
    'cancel': 'Annuller',
    'save_updates': 'Gem opdateringer',
    'route_tracking': 'Rutesporing og telemetri',

    // Carbon Footprint
    'decarbonization_analytics': 'Dekarbonisering og CO₂-analyse',
    'ghg_protocol_tracking': 'Standard GHG-protokol emissionssporing for Maersk Line rejsen',
    'verified_climate_data': 'Verificerede klimadata',
    'calculated_route': 'Beregnet ruteafstand',
    'total_weight': 'Total vægt',
    'estimated_co2': 'Anslået CO₂-udledning',
    'biofuel_active': 'Reduktion af CO₂-udledning med biobrændstof aktiv (-85%)',
    'glec_info': 'Baseret på GLEC-rammeværket. Faktiske udledninger kan variere afhængigt af skibets størrelse, nyttelast og brændstofspecifikation.',
    'maersk_eco_delivery': 'Maersk ECO Delivery',
    'biofuel_sub_header': 'Bæredygtigt 2. generations biobrændsel',
    'biofuel_description': 'Skift denne forsendelse til Maersk ECO Delivery for at erstatte fossilt brændstof med certificeret grønt biobrændsel. Sparer ca. 85% af den standardmæssige CO₂-udledning.',
    'certificate_issued': 'CO2-kompensationscertifikat udstedt',
    'saved_carbon': 'Besparings CO₂',
    'select_biofuel_desc': 'Vælg biobrændsel for at reducere miljøpåvirkningen',
    'voyage_mode_comparison': 'Sammenligning af transportform (Total CO₂-udledning)',
    'ocean_voyage': 'Søtransport (Maersk-rejse)',
    'intermodal_rail': 'Intermodal jernbane',
    'overland_road': 'Vejtransport',
    'express_air': 'Ekspres luftfragt',
    'current_mode': 'Nuværende',
  }
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('maersk_portal_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('maersk_portal_lang', lang);
  };

  const t = (key: string, defaultText: string): string => {
    const langDict = TRANSLATIONS[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    return defaultText;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
