import { StationItem, CatalogMaterialItem } from '../types/receipt';

export const OWNER_EMAIL = '6gb3sgbadm@gmail.com';

export const INITIAL_STATIONS: StationItem[] = [
  { id: 'eb_praia_grande', name: 'EB Praia Grande', code: 'EB-PG', city: 'Praia Grande' },
  { id: 'eb_sao_vicente', name: 'EB São Vicente', code: 'EB-SV', city: 'São Vicente' },
  { id: 'eb_itanhaem', name: 'EB Itanhaém', code: 'EB-ITA', city: 'Itanhaém' },
  { id: 'bb_rio_branco', name: 'BB Rio Branco', code: 'BB-RB', city: 'São Vicente / Rio Branco' },
  { id: 'b4_4sgb', name: 'B4 4°SGB', code: 'B4-4SGB', city: '4º Subgrupamento' },
  { id: 'bb_peruibe', name: 'BB Peruíbe', code: 'BB-PER', city: 'Peruíbe' },
  { id: 'bcom_iguape', name: 'BCOM IGUAPE', code: 'BCOM-IGU', city: 'Iguape' },
  { id: 'b4_sede', name: 'B4 SEDE', code: 'B4-SEDE', city: 'Santos / Sede 6º GB' },
  { id: 'eb_cajati', name: 'EB Cajati', code: 'EB-CAJ', city: 'Cajati' },
  { id: 'bcom_jacupiranga', name: 'BCOM Jacupiranga', code: 'BCOM-JAC', city: 'Jacupiranga' },
  { id: 'eb_registro', name: 'EB Registro', code: 'EB-REG', city: 'Registro' },
  { id: 'eb_ponta_da_praia', name: 'EB Ponta da Praia', code: 'EB-PDP', city: 'Santos' },
  { id: 'eb_mongagua', name: 'EB Mongaguá', code: 'EB-MON', city: 'Mongaguá' },
  { id: 'eb_eldorado', name: 'EB Eldorado', code: 'EB-ELD', city: 'Eldorado' },
  { id: 'csm_mopb', name: 'CSMMoPB', code: 'CSM', city: 'São Paulo' },
  { id: 'divitic_ccb', name: 'DIVITIC CCB', code: 'DIVITIC', city: 'São Paulo / CCB' },
];

export const STATIONS_PRESET = INITIAL_STATIONS.map((s) => s.name);

export const DELIVERERS_PRESET = [
  'CB PM SEDREZ',
  'CB PM MOLINA',
  '1º SGT PM GUSTAVO',
  'SUB TEN JUAREZ',
  '1º TEN PM MOREIRA LIMA',
] as const;

export const UNITS_PRESET = [
  'Unid',
  'CX',
  'Lts',
  'Kg',
  'Kit',
  'Par',
  'Mts',
  'Frasco',
] as const;

export const INITIAL_CATALOG_MATERIALS: CatalogMaterialItem[] = [
  { id: 'mat_01', name: 'PÁ DE DEA (ADULTO)', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_02', name: 'PÁ DE DEA (PEDIÁTRICO)', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_03', name: 'BATERIA DEA (LP0019525 / LP0023326)', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_04', name: 'PRANCHA LONGA COM 3 TIRANTES', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_05', name: 'KIT ENCOSTO DE CABEÇA PARA PRANCHA (HEAD BLOCK)', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_06', name: 'MANTA ALUMINIZADA', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_07', name: 'MÁSCARA DE O2 - PEDIÁTRICO', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_08', name: 'MÁSCARA DE O2 - ADULTO', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_09', name: 'REANIMADOR MANUAL - ADULTO (AMBU)', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_10', name: 'REANIMADOR MANUAL - PEDIÁTRICO (AMBU)', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_11', name: 'REANIMADOR MANUAL - NEONATAL (AMBU)', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_12', name: 'COLAR CERVICAL TAMANHO P', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_13', name: 'COLAR CERVICAL TAMANHO M', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_14', name: 'COLAR CERVICAL TAMANHO G', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_15', name: 'ATADURA DE CREPE 15 CM', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_16', name: 'ATADURA DE CREPE 20 CM', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_17', name: 'TALA ARAMADA MOLDÁVEL TAMANHO P', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_18', name: 'TALA ARAMADA MOLDÁVEL TAMANHO M', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_19', name: 'TALA ARAMADA MOLDÁVEL TAMANHO G', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_20', name: 'KIT PARTO DESCARTÁVEL', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_21', name: 'BOLSA DE RESGATE COMPLETA', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_22', name: 'GAZE ESTÉRIL', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_23', name: 'ESFIGNOMANOMETRO COM ESTETOSCÓPIO', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_24', name: 'ÓCULOS DE PROTEÇÃO INDIVIDUAL', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_25', name: 'LUVA DE PROCEDIMENTOS M', defaultUnit: 'CX', category: 'APH / Resgate' },
  { id: 'mat_26', name: 'BANDAGEM TRIANGULAR', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_27', name: 'SACO DE CADÁVER COM ZÍPER', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_28', name: 'DESINFETANTE HOSPITALAR (5 LTS)', defaultUnit: 'Unid', category: 'APH / Resgate' },
  { id: 'mat_29', name: 'LENÇOL DESCARTÁVEL', defaultUnit: 'Unid', category: 'APH / Resgate' },

  // Proteção Respiratória (EPR)
  { id: 'mat_30', name: 'CILINDRO DRAGER DE COMPÓSITO PARA TH NO CSM', defaultUnit: 'Unid', category: 'Proteção Respiratória (EPR)' },
  { id: 'mat_31', name: 'CILINDRO MSA DE COMPÓSITO PARA ALMOFADA PNEUMÁTICA', defaultUnit: 'Unid', category: 'Proteção Respiratória (EPR)' },
  { id: 'mat_32', name: 'CANGALHAS DRAGER COM MANÔMETRO', defaultUnit: 'Unid', category: 'Proteção Respiratória (EPR)' },
  { id: 'mat_33', name: 'CANGALHA MSA G1', defaultUnit: 'Unid', category: 'Proteção Respiratória (EPR)' },
  { id: 'mat_34', name: 'MÁSCARA FACIAL DRAGER', defaultUnit: 'Unid', category: 'Proteção Respiratória (EPR)' },
  { id: 'mat_35', name: 'MÁSCARA FACIAL MSA', defaultUnit: 'Unid', category: 'Proteção Respiratória (EPR)' },
  { id: 'mat_36', name: 'BASE CARREGADORA E FONTE (BATERIAS EPR MSA G1)', defaultUnit: 'Unid', category: 'Proteção Respiratória (EPR)' },
  { id: 'mat_37', name: 'BATERIA RESERVA EPR MSA', defaultUnit: 'Unid', category: 'Proteção Respiratória (EPR)' },

  // Combate a Incêndio & Químicos
  { id: 'mat_38', name: 'BOMBONA LGE 20 LTS (LÍQUIDO GERADOR DE ESPUMA)', defaultUnit: 'Unid', category: 'Combate a Incêndio' },
  { id: 'mat_39', name: 'GALÃO LGE', defaultUnit: 'Unid', category: 'Combate a Incêndio' },
  { id: 'mat_40', name: 'MANGUEIRA 1 1/2" DE COMBATE A INCÊNDIO', defaultUnit: 'Unid', category: 'Combate a Incêndio' },
  { id: 'mat_41', name: 'MANGUEIRA 2 1/2" DE COMBATE A INCÊNDIO', defaultUnit: 'Unid', category: 'Combate a Incêndio' },
  { id: 'mat_42', name: 'DETECTOR DE GASES HONEYWELL E ACESSÓRIOS (MALETA)', defaultUnit: 'Unid', category: 'Produtos Perigosos' },

  // Salvamento, Ferramentas & Iluminação
  { id: 'mat_43', name: 'LANTERNA NIGHTSTICK COM CARREGADOR 12V, BLITZ E CABO', defaultUnit: 'Unid', category: 'Iluminação & Salvamento' },
  { id: 'mat_44', name: 'DESENCARCERADOR LEVE A BATERIA WEBER SPS 360 COM ACESSÓRIOS', defaultUnit: 'Unid', category: 'Salvamento Veicular' },
  { id: 'mat_45', name: 'CÂMERA TÉRMICA FLIR K65 COM BASE E BATERIAS', defaultUnit: 'Unid', category: 'Busca & Salvamento' },
  { id: 'mat_46', name: 'CÂMERA TÉRMICA FLIR K45 COM BASE E BATERIAS', defaultUnit: 'Unid', category: 'Busca & Salvamento' },
  { id: 'mat_47', name: 'MOTO PODA STIHL HT 75', defaultUnit: 'Unid', category: 'Ferramentas Motorizadas' },
  { id: 'mat_48', name: 'MOTO ABRASIVO STIHL TS420', defaultUnit: 'Unid', category: 'Ferramentas Motorizadas' },
  { id: 'mat_49', name: 'MOTOSSERRA STIHL MS381', defaultUnit: 'Unid', category: 'Ferramentas Motorizadas' },
  { id: 'mat_50', name: 'MOTOSSERRA HUSQVARNA', defaultUnit: 'Unid', category: 'Ferramentas Motorizadas' },
  { id: 'mat_51', name: 'LUBRIFICANTE CORRENTE MOTOSSERRA', defaultUnit: 'Unid', category: 'Ferramentas Motorizadas' },
  { id: 'mat_52', name: 'DISCO MAKITA B55348 (AÇO E CONCRETO) PARA MOTO ABRASIVO', defaultUnit: 'Unid', category: 'Ferramentas Motorizadas' },
  { id: 'mat_53', name: 'LIMA CHATA MTX', defaultUnit: 'Unid', category: 'Ferramentas' },

  // Proteção Balística e Armamento
  { id: 'mat_54', name: 'COLETE BALÍSTICO MODELO MKS-6302 CONTENDO DUAS PLACAS E CAPA', defaultUnit: 'Unid', category: 'Proteção Balística' },
  { id: 'mat_55', name: 'COLETE BALÍSTICO MARCA PROTECOP MODELO PROPB-002', defaultUnit: 'Unid', category: 'Proteção Balística' },
  { id: 'mat_56', name: 'COLETE BALÍSTICO MARCA KAVRO MODELO MKS-6302', defaultUnit: 'Unid', category: 'Proteção Balística' },
  { id: 'mat_57', name: 'PISTOLA GLOCK .40 COM CARREGADORES E MUNIÇÕES', defaultUnit: 'Unid', category: 'Armamento' },
  { id: 'mat_58', name: 'CARREGADORES PARA PISTOLA GLOCK .40', defaultUnit: 'Unid', category: 'Armamento' },
  { id: 'mat_59', name: 'MUNIÇÕES INTACTAS PARA PISTOLA GLOCK .40', defaultUnit: 'Unid', category: 'Armamento' },

  // Treinamento, Comunicação & Intendência
  { id: 'mat_60', name: 'TORSO PARA TREINO DE RCP (ADULTO/CRIANÇA)', defaultUnit: 'Unid', category: 'Instrução & Treinamento' },
  { id: 'mat_61', name: 'BONECO PARA TREINO RCP (RN / BEBÊ)', defaultUnit: 'Unid', category: 'Instrução & Treinamento' },
  { id: 'mat_62', name: 'RÁDIO MOTOROLA APX2500', defaultUnit: 'Unid', category: 'Telecomunicações' },
  { id: 'mat_63', name: 'RÁDIO MOTOROLA XTL 5000', defaultUnit: 'Unid', category: 'Telecomunicações' },
  { id: 'mat_64', name: 'HT TAIT COM FONTE, BASE, LAPELA E ACESSÓRIOS', defaultUnit: 'Unid', category: 'Telecomunicações' },
  { id: 'mat_65', name: 'MÁQUINA DE LAVAR MIDEA WAVE AGITATOR 13KG', defaultUnit: 'Unid', category: 'Alojamento / Intendência' },
  { id: 'mat_66', name: 'FOGÃO INOX 4 BOCAS', defaultUnit: 'Unid', category: 'Alojamento / Intendência' },
  { id: 'mat_67', name: 'FORNO MICROONDAS', defaultUnit: 'Unid', category: 'Alojamento / Intendência' },
  { id: 'mat_68', name: 'ETIQUETAS PATRIMÔNIO', defaultUnit: 'Unid', category: 'Patrimônio B4' },
];

export const COMMON_MATERIALS = INITIAL_CATALOG_MATERIALS.map((m) => m.name);
