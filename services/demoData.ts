import {
  LearningLevel,
  LearningGoal,
  SessionSummary,
  WordDefinition,
  ChatMessage,
} from '../types';
import { SessionAnalysis } from './summaryService';

/**
 * In-memory sample data for the guided demo. Nothing here touches Supabase or
 * the LLM, so the whole flow can be shown offline, without an account, a mic,
 * or a working model key.
 */

export const demoProfile = {
  level: LearningLevel.INTERMEDIATE,
  goal: LearningGoal.TRAVEL,
  coach: 'alma' as const,
};

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

export const demoNotebook: WordDefinition[] = [
  { word: 'reservar', translation: 'to book / reserve', example: 'Quiero reservar una habitación.', exampleTranslation: 'I want to book a room.', pronunciation: 're-ser-VAR' },
  { word: 'equipaje', translation: 'luggage', example: '¿Dónde recojo mi equipaje?', exampleTranslation: 'Where do I pick up my luggage?', pronunciation: 'e-ki-PA-je' },
  { word: 'aduana', translation: 'customs', example: 'Tuve que pasar por la aduana.', exampleTranslation: 'I had to go through customs.', pronunciation: 'a-DUA-na' },
  { word: 'retraso', translation: 'delay', example: 'El vuelo tiene un retraso de dos horas.', exampleTranslation: 'The flight has a two-hour delay.', pronunciation: 're-TRA-so' },
  { word: 'facturar', translation: 'to check in (luggage)', example: 'Necesito facturar esta maleta.', exampleTranslation: 'I need to check in this suitcase.', pronunciation: 'fak-tu-RAR' },
  { word: 'alojamiento', translation: 'accommodation', example: 'El alojamiento incluye el desayuno.', exampleTranslation: 'The accommodation includes breakfast.', pronunciation: 'a-lo-ha-MIEN-to' },
  { word: 'propina', translation: 'tip (gratuity)', example: '¿Está incluida la propina?', exampleTranslation: 'Is the tip included?', pronunciation: 'pro-PI-na' },
  { word: 'madrugar', translation: 'to get up early', example: 'Mañana tengo que madrugar.', exampleTranslation: 'Tomorrow I have to get up early.', pronunciation: 'ma-dru-GAR' },
  { word: 'sencillo', translation: 'single / simple', example: 'Un billete sencillo, por favor.', exampleTranslation: 'A one-way ticket, please.', pronunciation: 'sen-CI-llo' },
  { word: 'aforo', translation: 'capacity', example: 'El museo tiene un aforo limitado.', exampleTranslation: 'The museum has limited capacity.', pronunciation: 'a-FO-ro' },
];

// The learner keeps confusing ser/estar and preterite endings — repeated across
// sessions so the planner agent surfaces them as recurring focus points.
export const demoMistakes: string[] = [
  'Watch ser vs estar with locations and feelings',
  'Preterite endings for -er / -ir verbs',
  'Gender agreement on travel nouns',
];

export const demoDueVocab: WordDefinition[] = demoNotebook.slice(0, 6);

export const demoHistory: SessionSummary[] = [
  {
    id: 'demo-s1',
    date: daysAgo(1),
    level: LearningLevel.INTERMEDIATE,
    goal: LearningGoal.TRAVEL,
    coach: 'alma',
    duration: '6 min 12 sec',
    overview: 'Practised checking into a hotel: greeting the receptionist, asking about the room, breakfast times, and Wi-Fi.',
    transcript: [
      { id: 'd1-1', sender: 'coach', text: 'Buenos días, ¿en qué puedo ayudarle?', translation: 'Good morning, how can I help you?', timestamp: daysAgo(1) },
      { id: 'd1-2', sender: 'user', text: 'Hola, tengo una reserva a nombre de María.', timestamp: daysAgo(1) },
    ],
    vocabulary: [demoNotebook[0], demoNotebook[5]],
    grammarPoints: ['Formal "usted" in service situations', 'Ser vs estar with locations'],
    feedback: {
      strengths: ['Confident greetings', 'Good use of "quisiera" for polite requests'],
      improvements: ['Watch ser vs estar with locations and feelings', 'Gender agreement on travel nouns'],
      note: '¡Muy bien! Your hotel small talk is getting smoother.',
    },
  },
  {
    id: 'demo-s2',
    date: daysAgo(3),
    level: LearningLevel.INTERMEDIATE,
    goal: LearningGoal.TRAVEL,
    coach: 'alma',
    duration: '5 min 40 sec',
    overview: 'Role-played the airport: checking in luggage, asking about a delay, and finding the boarding gate.',
    transcript: [
      { id: 'd2-1', sender: 'coach', text: '¿Va a facturar equipaje hoy?', translation: 'Are you checking in luggage today?', timestamp: daysAgo(3) },
      { id: 'd2-2', sender: 'user', text: 'Sí, tengo una maleta.', timestamp: daysAgo(3) },
    ],
    vocabulary: [demoNotebook[1], demoNotebook[4], demoNotebook[3]],
    grammarPoints: ['Preterite endings for -er / -ir verbs'],
    feedback: {
      strengths: ['Great airport vocabulary', 'Clear questions about the delay'],
      improvements: ['Preterite endings for -er / -ir verbs', 'Watch ser vs estar with locations and feelings'],
      note: 'You handled the delay conversation calmly — nice work.',
    },
  },
  {
    id: 'demo-s3',
    date: daysAgo(6),
    level: LearningLevel.INTERMEDIATE,
    goal: LearningGoal.TRAVEL,
    coach: 'alma',
    duration: '7 min 03 sec',
    overview: 'Ordered food at a restaurant, asked about the tip, and made a simple complaint politely.',
    transcript: [
      { id: 'd3-1', sender: 'coach', text: '¿Ya sabe qué va a pedir?', translation: 'Do you know what you will order?', timestamp: daysAgo(6) },
      { id: 'd3-2', sender: 'user', text: 'Sí, quiero la paella, por favor.', timestamp: daysAgo(6) },
    ],
    vocabulary: [demoNotebook[6]],
    grammarPoints: ['Polite requests with "me gustaría"', 'Gender agreement on travel nouns'],
    feedback: {
      strengths: ['Natural ordering phrases', 'Polite tone throughout'],
      improvements: ['Gender agreement on travel nouns'],
      note: 'Your restaurant Spanish is really coming along!',
    },
  },
];

// A scripted travel conversation played back during the demo session.
const scriptBase = Date.now();
const t = (i: number) => new Date(scriptBase + i * 30 * 1000);

export const demoScript: ChatMessage[] = [
  { id: 'ds-1', sender: 'coach', text: '¡Hola! Bienvenida de nuevo. Hoy vamos a practicar cómo reservar un alojamiento. ¿Lista?', translation: 'Hi! Welcome back. Today we will practise booking accommodation. Ready?', timestamp: t(0) },
  { id: 'ds-2', sender: 'user', text: 'Sí, estoy lista. Quiero reservar una habitación para dos noches.', timestamp: t(1) },
  { id: 'ds-3', sender: 'coach', text: 'Perfecto. ¿Prefiere una habitación sencilla o doble?', translation: 'Perfect. Do you prefer a single or double room?', timestamp: t(2) },
  { id: 'ds-4', sender: 'user', text: 'Una habitación doble, por favor. ¿El alojamiento incluye el desayuno?', timestamp: t(3) },
  { id: 'ds-5', sender: 'coach', text: 'Sí, el desayuno está incluido. ¿A qué hora piensa llegar?', translation: 'Yes, breakfast is included. What time do you plan to arrive?', timestamp: t(4) },
  { id: 'ds-6', sender: 'user', text: 'Llego por la tarde, pero mañana tengo que madrugar para el tren.', timestamp: t(5) },
  { id: 'ds-7', sender: 'coach', text: '¡Muy bien dicho! Usó "madrugar" perfectamente. Le preparamos un desayuno temprano.', translation: 'Very well said! You used "madrugar" perfectly. We will prepare an early breakfast for you.', timestamp: t(6) },
];

export const demoSessionVocab: WordDefinition[] = [demoNotebook[0], demoNotebook[5], demoNotebook[7]];

export const demoAnalysis: SessionAnalysis = {
  overview: 'Practised booking accommodation: choosing a room type, asking about breakfast, and arranging an early departure.',
  grammarPoints: ['Ser vs estar with feelings ("estoy lista")', 'Present tense for plans and schedules'],
  feedback: {
    strengths: [
      'Used "madrugar" and "alojamiento" naturally',
      'Clear, confident questions about the booking',
    ],
    improvements: [
      'Double-check ser vs estar with feelings and locations',
      'Practise preterite endings for -er / -ir verbs',
    ],
    note: '¡Excelente sesión! Your travel Spanish is really taking shape.',
  },
};
