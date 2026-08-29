import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

const SUPABASE_URL = "https://upuruwptmgfxdkzmchij.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwdXJ1d3B0bWdmeGRrem1jaGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NDY2MjIsImV4cCI6MjEwMzUyMjYyMn0.mn0Tzs1kHSgM4wnaiSZGSICkMmZBiqMMiRmJ2pZ2KOg";

function getSupabaseRoleFromJwt() {
  if (!SUPABASE_ANON_KEY || !SUPABASE_ANON_KEY.includes(".")) {
    return null;
  }

  try {
    const payload = SUPABASE_ANON_KEY.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = atob(padded);
    const parsed = JSON.parse(
      decodeURIComponent(
        Array.from(decoded).map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join("")
      )
    );

    return parsed?.role || null;
  } catch (_error) {
    return null;
  }
}

const supabaseRole = getSupabaseRoleFromJwt();
const isServiceRoleKey = supabaseRole === "service_role";

const hasSupabaseConfig = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("YOUR-") &&
  !SUPABASE_ANON_KEY.includes("YOUR-")
);

function createSupabaseClient() {
  if (typeof window === "undefined" || !window.supabase || !hasSupabaseConfig) {
    return null;
  }

  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const supabase = createSupabaseClient();

async function saveToSupabase(tableName, payload) {
  if (!supabase) {
    console.warn("Supabase is not configured. Add your project URL and anon key.");
    return { ok: false, error: "Supabase not configured" };
  }

  try {
    const { data, error } = await supabase.from(tableName).insert(payload).select();

    if (error) {
      console.error(`Error saving to ${tableName}:`, error);
      return { ok: false, error };
    }

    return { ok: true, data };
  } catch (error) {
    console.error(`Unexpected error saving to ${tableName}:`, error);
    return { ok: false, error };
  }
}

async function upsertProfileFromAuth(user, role) {
  if (!supabase || !user) return { ok: false, error: "No authenticated user" };

  const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario";
  const finalRole = role || user.user_metadata?.role || "student";

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
    email: user.email,
    role: finalRole,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Profile upsert failed:", error);
    return { ok: false, error };
  }

  return { ok: true };
}

const categoryPalette = {
  Arte: "#d88554",
  Bienestar: "#5ca6d8",
  Negocios: "#7d8de6",
  Cocina: "#ef9d5d",
  Tecnología: "#58b7c0",
  Idiomas: "#8a7ae9",
  Diseño: "#e58c87",
};

function getCategoryColor(category, seed = 0) {
  const base = categoryPalette[category] || "#b3b3b3";
  const variance = ((seed * 97 + 41) % 100) / 99;
  const start = mixWithWhite(base, 0.08 + variance * 0.42);
  const end = mixWithBlack(base, 0.14 + variance * 0.42);
  return `linear-gradient(135deg, ${start}, ${end})`;
}

const classes = [
  { id: 1, title: "Cerámica & Modelado Básico", category: "Arte", rating: 4.9, level: "Principiante", price: 320, color: "linear-gradient(135deg, #d88554, #c86f4f)", description: "Aprende técnicas de modelado y terminación con un espacio cálido y cercano.", schedule: [{ day: "Lun", time: "18:00 - 20:00" }, { day: "Mié", time: "18:00 - 20:00" }] },
  { id: 2, title: "Pintura Abstracta Express", category: "Arte", rating: 4.8, level: "Todos los niveles", price: 340, color: "linear-gradient(135deg, #e39e5d, #d76b45)", description: "Explora capas, texturas y composición para crear piezas expresivas y modernas.", schedule: [{ day: "Mar", time: "17:30 - 19:30" }, { day: "Jue", time: "17:30 - 19:30" }] },
  { id: 3, title: "Dibujo de Figura y Formas", category: "Arte", rating: 4.7, level: "Principiante", price: 300, color: "linear-gradient(135deg, #c98874, #ac5d5d)", description: "Mejora tu observación y dibujo con ejercicios de proporción, volumen y movimiento.", schedule: [{ day: "Lun", time: "16:00 - 18:00" }, { day: "Vie", time: "10:00 - 12:00" }] },
  { id: 4, title: "Collage y Materiales Mixtos", category: "Arte", rating: 4.9, level: "Intermedio", price: 360, color: "linear-gradient(135deg, #d885b8, #8e62b8)", description: "Combina papeles, telas y objetos para construir narrativas visuales y piezas únicas.", schedule: [{ day: "Mié", time: "18:30 - 20:30" }, { day: "Sáb", time: "11:00 - 13:00" }] },
  { id: 5, title: "Fotografía Creativa Nocturna", category: "Arte", rating: 4.8, level: "Intermedio", price: 390, color: "linear-gradient(135deg, #5a6da8, #2d3d7a)", description: "Domina la luz artificial, composición y edición para capturar atmósferas urbanas.", schedule: [{ day: "Jue", time: "19:00 - 21:00" }, { day: "Sáb", time: "15:00 - 17:00" }] },

  { id: 6, title: "Vinyasa Flow Matutino", category: "Bienestar", rating: 5.0, level: "Todos los niveles", price: 280, color: "linear-gradient(135deg, #5c7fe8, #314bb4)", description: "Una práctica suave con foco en movilidad, respiración y energía para comenzar el día.", schedule: [{ day: "Mar", time: "08:00 - 09:00" }, { day: "Jue", time: "08:00 - 09:00" }] },
  { id: 7, title: "Meditación Guiada para Enfoque", category: "Bienestar", rating: 4.9, level: "Principiante", price: 260, color: "linear-gradient(135deg, #7bb4d6, #4a8bb8)", description: "Reduce ruido mental y mejora tu claridad con ejercicios de respiración y presencia.", schedule: [{ day: "Lun", time: "08:30 - 09:30" }, { day: "Vie", time: "08:30 - 09:30" }] },
  { id: 8, title: "Pilates Core y Postura", category: "Bienestar", rating: 4.8, level: "Intermedio", price: 310, color: "linear-gradient(135deg, #3cb0a8, #267d7a)", description: "Fortalece tu centro, mejora tu postura y aumenta estabilidad con fuerza controlada.", schedule: [{ day: "Mar", time: "18:00 - 19:30" }, { day: "Jue", time: "18:00 - 19:30" }] },
  { id: 9, title: "Yoga para Recuperación", category: "Bienestar", rating: 4.9, level: "Todos los niveles", price: 290, color: "linear-gradient(135deg, #8ac7b0, #4c9d86)", description: "Una sesión intuitiva para aliviar tensión, recuperar energía e ir más despacio.", schedule: [{ day: "Mié", time: "07:30 - 08:30" }, { day: "Sáb", time: "09:30 - 10:30" }] },
  { id: 10, title: "Mindfulness y Habitos Sostenibles", category: "Bienestar", rating: 4.7, level: "Principiante", price: 270, color: "linear-gradient(135deg, #a6d9b7, #5fa373)", description: "Aprende prácticas sencillas para gestionar estrés y crear rutinas más equilibradas.", schedule: [{ day: "Vie", time: "18:00 - 19:00" }, { day: "Dom", time: "10:00 - 11:00" }] },

  { id: 11, title: "Branding para Pequeños Negocios", category: "Negocios", rating: 4.8, level: "Intermedio", price: 410, color: "linear-gradient(135deg, #7d8db8, #4d5e9d)", description: "Define tu identidad visual, comunica tu propuesta y mejora la presencia de tu marca.", schedule: [{ day: "Vie", time: "17:30 - 19:30" }] },
  { id: 12, title: "Ventas Consultivas para Freelancers", category: "Negocios", rating: 4.9, level: "Intermedio", price: 420, color: "linear-gradient(135deg, #7187d6, #4858ac)", description: "Construye conversaciones más claras, propuestas con valor y cierres más seguros.", schedule: [{ day: "Mar", time: "17:00 - 19:00" }, { day: "Jue", time: "17:00 - 19:00" }] },
  { id: 13, title: "Estrategia de Content Marketing", category: "Negocios", rating: 4.8, level: "Avanzado", price: 460, color: "linear-gradient(135deg, #9a8de0, #6758be)", description: "Planifica campañas, contenido y métricas para atraer clientes con una narrativa sólida.", schedule: [{ day: "Lun", time: "19:00 - 21:00" }, { day: "Mié", time: "19:00 - 21:00" }] },
  { id: 14, title: "Pitch Deck y Presentaciones", category: "Negocios", rating: 4.7, level: "Intermedio", price: 395, color: "linear-gradient(135deg, #7fa1d1, #4c6ca0)", description: "Diseña presentaciones persuasivas con estructura clara, visual y mensajes enfocados.", schedule: [{ day: "Jue", time: "18:00 - 20:00" }, { day: "Sáb", time: "13:00 - 15:00" }] },
  { id: 15, title: "Fundamentos de Liderazgo", category: "Negocios", rating: 4.9, level: "Principiante", price: 380, color: "linear-gradient(135deg, #91a2dc, #5d6ca1)", description: "Desarrolla comunicación, toma de decisiones y manejo de equipos desde una base práctica.", schedule: [{ day: "Mié", time: "17:00 - 19:00" }, { day: "Vie", time: "17:00 - 19:00" }] },

  { id: 16, title: "Cocina Mexicana con Base", category: "Cocina", rating: 4.9, level: "Principiante", price: 350, color: "linear-gradient(135deg, #df8b5b, #c95c35)", description: "Prepara sabores intensos con técnicas sencillas para platos tradicionales y modernos.", schedule: [{ day: "Mar", time: "18:00 - 20:00" }, { day: "Jue", time: "18:00 - 20:00" }] },
  { id: 17, title: "Pastelería Casera Creativa", category: "Cocina", rating: 4.8, level: "Todos los niveles", price: 330, color: "linear-gradient(135deg, #f0b26b, #d98054)", description: "Aprende masas, rellenos y decoraciones para postres visualmente bonitos y sabrosos.", schedule: [{ day: "Lun", time: "17:00 - 19:00" }, { day: "Sáb", time: "10:00 - 12:00" }] },
  { id: 18, title: "Bebidas & Cocteles de Inicio", category: "Cocina", rating: 4.7, level: "Principiante", price: 340, color: "linear-gradient(135deg, #d17071, #b64d4d)", description: "Experimenta con sabores frescos, aromas y técnicas básicas para cocktails caseros.", schedule: [{ day: "Mié", time: "18:30 - 20:30" }, { day: "Vie", time: "18:30 - 20:30" }] },
  { id: 19, title: "Platos Saludables y Rápidos", category: "Cocina", rating: 4.9, level: "Intermedio", price: 315, color: "linear-gradient(135deg, #79b764, #4d8d4c)", description: "Diseña comidas equilibradas con creatividad y rapidez para la vida diaria.", schedule: [{ day: "Lun", time: "12:30 - 14:00" }, { day: "Vie", time: "12:30 - 14:00" }] },
  { id: 20, title: "Panadería Artesanal", category: "Cocina", rating: 4.8, level: "Intermedio", price: 370, color: "linear-gradient(135deg, #d8c075, #b88d3c)", description: "Explora masas fermentadas, formatos y sabores para panes de panadería casera.", schedule: [{ day: "Mar", time: "16:00 - 18:00" }, { day: "Sáb", time: "12:00 - 14:00" }] },

  { id: 21, title: "Introducción a Python", category: "Tecnología", rating: 4.9, level: "Principiante", price: 420, color: "linear-gradient(135deg, #5d8ef1, #2f60c5)", description: "Aprende fundamentos de programación con ejercicios prácticos y proyectos sencillos.", schedule: [{ day: "Lun", time: "18:00 - 20:00" }, { day: "Jue", time: "18:00 - 20:00" }] },
  { id: 22, title: "Diseño UX para Productos", category: "Tecnología", rating: 4.8, level: "Intermedio", price: 440, color: "linear-gradient(135deg, #58b7c0, #2f6c9e)", description: "Crea experiencias más claras con investigación, prototipos y análisis de flujo.", schedule: [{ day: "Mar", time: "17:30 - 19:30" }, { day: "Vie", time: "17:30 - 19:30" }] },
  { id: 23, title: "No-Code con Automations", category: "Tecnología", rating: 4.7, level: "Principiante", price: 390, color: "linear-gradient(135deg, #8b7ae0, #5d5bb0)", description: "Automatiza tareas usando flujos, conectores y lógica visual sin escribir código complejo.", schedule: [{ day: "Mié", time: "18:00 - 20:00" }, { day: "Sáb", time: "11:00 - 13:00" }] },
  { id: 24, title: "Data Visualization Essentials", category: "Tecnología", rating: 4.9, level: "Intermedio", price: 430, color: "linear-gradient(135deg, #5e9ad3, #466bb5)", description: "Muestra insights con visualización efectiva, dashboard y storytelling analítico.", schedule: [{ day: "Jue", time: "19:00 - 21:00" }, { day: "Dom", time: "10:00 - 12:00" }] },
  { id: 25, title: "HTML, CSS y Frontend Básico", category: "Tecnología", rating: 4.8, level: "Principiante", price: 380, color: "linear-gradient(135deg, #7ca9d6, #4d7bb2)", description: "Crea interfaces web desde cero y entiende la estructura y estilo de las páginas.", schedule: [{ day: "Lun", time: "16:30 - 18:30" }, { day: "Vie", time: "16:30 - 18:30" }] },

  { id: 26, title: "Inglés para Conversación", category: "Idiomas", rating: 4.9, level: "Principiante", price: 300, color: "linear-gradient(135deg, #9c7ef0, #6d59c4)", description: "Mejora tu fluidez con práctica de conversación, pronunciación y vocabulario útil.", schedule: [{ day: "Lun", time: "18:30 - 20:00" }, { day: "Jue", time: "18:30 - 20:00" }] },
  { id: 27, title: "Francés para Viajes", category: "Idiomas", rating: 4.7, level: "Principiante", price: 290, color: "linear-gradient(135deg, #8e9dd9, #5569b5)", description: "Aprende frases esenciales para viajar, socializar y sentirte más seguro al comunicarte.", schedule: [{ day: "Mar", time: "19:00 - 20:30" }, { day: "Sáb", time: "10:30 - 12:00" }] },
  { id: 28, title: "Italiano para Viajar y Cocinar", category: "Idiomas", rating: 4.8, level: "Todos los niveles", price: 320, color: "linear-gradient(135deg, #d9896e, #b85b4b)", description: "Combina vocabulario útil con frases para viajar, comer y conectar con personas.", schedule: [{ day: "Mié", time: "17:30 - 19:00" }, { day: "Vie", time: "17:30 - 19:00" }] },
  { id: 29, title: "Pronunciación en Inglés Avanzado", category: "Idiomas", rating: 4.9, level: "Intermedio", price: 340, color: "linear-gradient(135deg, #6ec0d7, #3f8eb3)", description: "Mejora entonación, ritmo y claridad en conversaciones más fluidas y naturales.", schedule: [{ day: "Mié", time: "18:00 - 19:30" }, { day: "Dom", time: "09:00 - 10:30" }] },
  { id: 30, title: "Español para Extranjeros", category: "Idiomas", rating: 5.0, level: "Principiante", price: 310, color: "linear-gradient(135deg, #82c77a, #4b954b)", description: "Desarrolla confianza con conversaciones prácticas, vocabulario cotidiano y pronunciación.", schedule: [{ day: "Lun", time: "17:00 - 18:30" }, { day: "Vie", time: "17:00 - 18:30" }] },

  { id: 31, title: "Diseño Gráfico de Logotipos", category: "Diseño", rating: 4.8, level: "Principiante", price: 360, color: "linear-gradient(135deg, #e89280, #c86464)", description: "Crea marcas memorables con tipografía, color y estructuras visuales sólidas.", schedule: [{ day: "Mar", time: "18:00 - 20:00" }, { day: "Jue", time: "18:00 - 20:00" }] },
  { id: 32, title: "Diseño de Posters y Editorial", category: "Diseño", rating: 4.9, level: "Intermedio", price: 390, color: "linear-gradient(135deg, #f0a676, #d7773e)", description: "Aprende composición, jerarquía visual y teoría cromática para piezas editoriales.", schedule: [{ day: "Lun", time: "19:00 - 21:00" }, { day: "Sáb", time: "13:00 - 15:00" }] },
  { id: 33, title: "Illustración Digital Básica", category: "Diseño", rating: 4.8, level: "Principiante", price: 350, color: "linear-gradient(135deg, #c38de8, #8360c4)", description: "Explora pinceles, formas y capas para crear ilustraciones con estilo personal.", schedule: [{ day: "Mié", time: "17:30 - 19:30" }, { day: "Vie", time: "17:30 - 19:30" }] },
  { id: 34, title: "Brand Systems y Manuales", category: "Diseño", rating: 4.7, level: "Avanzado", price: 440, color: "linear-gradient(135deg, #8da6e0, #5472bb)", description: "Construye sistemas visuales coherentes con guía de marca, aplicaciones y consistencia.", schedule: [{ day: "Jue", time: "17:00 - 19:00" }, { day: "Dom", time: "12:00 - 14:00" }] },
  { id: 35, title: "Presentación Visual para Proyectos", category: "Diseño", rating: 4.9, level: "Intermedio", price: 400, color: "linear-gradient(135deg, #77b8bf, #4e8ea0)", description: "Diseña presentaciones impactantes con estructura visual, contenido narrativo y claridad.", schedule: [{ day: "Mar", time: "17:00 - 19:00" }, { day: "Vie", time: "10:00 - 12:00" }] }
];

const workshopAddresses = {
  1: { address: "Avenida Revolución 1420, Zona Centro, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Av.%20%C3%81lvaro%20Obreg%C3%B3n%20180%2C%20Roma%20Norte%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  2: { address: "Calle 10 1250, Zona Centro, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Calle%20de%20la%20Palma%2045%2C%20Condesa%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  3: { address: "Avenida de la Constitución 3110, Real del Sol, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Avenida%20Insurgentes%20Sur%20982%2C%20Del%20Valle%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  4: { address: "Calle 5 de Mayo 1450, Centro, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Calle%20de%20Oaxaca%2076%2C%20Roma%20Sur%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  5: { address: "Boulevard Díaz Ordaz 1701, El Prado, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Eje%20Central%20L%C3%A1zaro%20C%C3%A1rdenas%20208%2C%20Centro%20Hist%C3%B3rico%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  6: { address: "Avenida de la Reforma 1800, Colonia Revolución, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Av.%20de%20la%20Reforma%20180%2C%20Ju%C3%A1rez%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  7: { address: "Calle 4ta 1510, Zona Centro, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Calle%20de%20Durango%2032%2C%20Roma%20Norte%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  8: { address: "Avenida de los Insurgentes 440, Zona del Río, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Avenida%20Amsterdam%20120%2C%20Condesa%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  9: { address: "Blvd. Benjamín Franklin 1320, Playas de Tijuana, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Blvd.%20Miguel%20de%20Cervantes%20Saavedra%2052%2C%20Santa%20F%C3%A9%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  10: { address: "Calle 20 de Noviembre 926, Centro, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Calle%20de%20Veracruz%2068%2C%20Roma%20Sur%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  11: { address: "Paseo de los Héroes 1030, Centro, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Paseo%20de%20la%20Reforma%20101%2C%20Ju%C3%A1rez%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  12: { address: "Calle 2da 1802, Colonia Ferrocarril, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Calle%20de%20C%C3%B3rdoba%2087%2C%20Roma%20Norte%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  13: { address: "Avenida de los Deportes 760, Playas de Tijuana, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Avenida%20Patriotismo%20708%2C%20San%20Pedro%20de%20los%20Pinos%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  14: { address: "Calle Río Tijuana 150, La Joya, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Calle%20de%20La%20Paz%20150%2C%20Colonia%20del%20Carmen%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  15: { address: "Avenida Universidad 1170, Colonia Libertad, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Avenida%20Universidad%20117%2C%20Coyoac%C3%A1n%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  16: { address: "Avenida del Futuro 410, San Ysidro, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Av.%20de%20la%20Paz%2041%2C%20San%20%C3%81ngel%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  17: { address: "Calle Colima 1120, Centro, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Calle%20de%20Colima%20112%2C%20Roma%20Sur%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  18: { address: "Avenida México 520, Colonia Juárez, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Avenida%20M%C3%A9xico%20520%2C%20Condesa%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  19: { address: "Calle Loma 240, Cañadas, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Calle%20de%20la%20Naranja%2024%2C%20Del%20Valle%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  20: { address: "Avenida del Sol 310, La Mesa, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Av.%20de%20las%20Palmas%20310%2C%20Polanco%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  21: { address: "Calle de la Paz 1320, Centro, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Calle%20de%20Riva%20Palacio%20132%2C%20Centro%20Hist%C3%B3rico%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  22: { address: "Avenida Oaxaca 2120, Colonia La Presa, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Avenida%20Oaxaca%20212%2C%20Roma%20Norte%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  23: { address: "Calle Tecate 1010, Centro, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Calle%20de%20Hopi%2010%2C%20Ju%C3%A1rez%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  24: { address: "Calle de la Moneda 440, Centro, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Fray%20Servando%20Teresa%20de%20Mier%2044%2C%20Centro%20Hist%C3%B3rico%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  25: { address: "Calle Londres 1820, Colonia Santa Fe, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Calle%20de%20Londres%20182%2C%20Del%20Valle%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  26: { address: "Calle Amsterdam 550, Colonia del Rio, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Calle%20de%20Amsterdam%2055%2C%20Condesa%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  27: { address: "Avenida Piedad 700, Colonia del Prado, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Avenida%20Piedad%2070%2C%20Coyoac%C3%A1n%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  28: { address: "Calle Generación 180, Colonia Chapultepec, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Calle%20de%20Generaci%C3%B3n%2018%2C%20Roma%20Sur%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  29: { address: "Avenida Rosales 370, Colonia Las Flores, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Av.%20de%20los%20Rosales%2037%2C%20Las%20%C3%81guilas%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  30: { address: "Calle Puebla 820, Colonia Río, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Calle%20de%20Puebla%2082%2C%20Roma%20Norte%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  31: { address: "Avenida Parque 310, Colonia del Sol, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Avenida%20Parque%20M%C3%A9xico%2031%2C%20Condesa%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  32: { address: "Calle Xola 970, Colonia Benito Juárez, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Calle%20de%20Xola%2097%2C%20Benito%20Ju%C3%A1rez%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  33: { address: "Calle Independencia 1500, Centro, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Calle%20de%20Independencia%20150%2C%20Centro%20Hist%C3%B3rico%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  34: { address: "Calle Soledad 760, Jardines del Río, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Calle%20de%20la%20Soledad%2076%2C%20San%20Miguel%20Chapultepec%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
  35: { address: "Avenida Morelos 1100, Centro, Tijuana, Baja California", mapUrl: "https://www.google.com/maps?q=Avenida%20Morelos%20110%2C%20Centro%2C%20Tijuana%2C%20Baja%20California&z=14&output=embed" },
};

function buildMapUrlFromAddress(address) {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=14&output=embed`;
}

Object.entries(workshopAddresses).forEach(([, entry]) => {
  if (entry && entry.address) {
    entry.mapUrl = buildMapUrlFromAddress(entry.address);
  }
});

const roleOptions = ["student", "instructor", "host"];
const categoryOptions = ["Todo", "Arte", "Bienestar", "Negocios", "Cocina", "Tecnología", "Idiomas", "Diseño"];
const fullWeekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const dailyTimeSlots = [
  "08:00 - 09:00",
  "09:30 - 10:30",
  "11:00 - 12:30",
  "12:30 - 14:00",
  "16:00 - 17:30",
  "18:00 - 19:30",
  "19:00 - 20:30",
  "20:30 - 22:00",
];
const themeOptions = [
  { id: "classic", label: "Classic" },
  { id: "dark", label: "Dark" },
  { id: "sunset", label: "Sunset" },
  { id: "forest", label: "Forest" },
  { id: "lavender", label: "Lavender" },
  { id: "custom", label: "Custom" },
];

const themeStyles = {
  classic: {
    "--bg": "#f4efe8",
    "--panel": "#ffffff",
    "--panel-alt": "#f7f4f0",
    "--ink": "#1d2333",
    "--muted": "#5d6477",
    "--border": "rgba(29, 35, 51, 0.12)",
    "--primary": "#2f4bb5",
    "--primary-soft": "#ecf1ff",
    "--accent": "#ef8b5e",
    "--accent-soft": "#fff0e5",
    "--success": "#1f8a5a",
    "--shadow": "0 18px 44px rgba(28, 35, 60, 0.08)",
  },
  dark: {
    "--bg": "#0f172a",
    "--panel": "#111827",
    "--panel-alt": "#1f2937",
    "--ink": "#f8fafc",
    "--muted": "#cbd5e1",
    "--border": "rgba(148, 163, 184, 0.2)",
    "--primary": "#7c9cff",
    "--primary-soft": "#1e2a4a",
    "--accent": "#fbbf24",
    "--accent-soft": "#3b2d1d",
    "--success": "#34d399",
    "--shadow": "0 18px 44px rgba(15, 23, 42, 0.5)",
  },
  sunset: {
    "--bg": "#fff3ec",
    "--panel": "#fff8f4",
    "--panel-alt": "#ffe9de",
    "--ink": "#2b1b14",
    "--muted": "#6d4d45",
    "--border": "rgba(103, 63, 49, 0.14)",
    "--primary": "#d65f48",
    "--primary-soft": "#ffe3d8",
    "--accent": "#f39b4a",
    "--accent-soft": "#fff0d9",
    "--success": "#2f9f77",
    "--shadow": "0 18px 44px rgba(139, 72, 54, 0.12)",
  },
  forest: {
    "--bg": "#edf7f0",
    "--panel": "#f8fffb",
    "--panel-alt": "#e2f4e8",
    "--ink": "#173127",
    "--muted": "#4d6358",
    "--border": "rgba(23, 49, 39, 0.12)",
    "--primary": "#2d7a5b",
    "--primary-soft": "#dff5ea",
    "--accent": "#cb8d33",
    "--accent-soft": "#f3ebd7",
    "--success": "#2a8a63",
    "--shadow": "0 18px 44px rgba(34, 73, 59, 0.12)",
  },
  lavender: {
    "--bg": "#f4f1ff",
    "--panel": "#ffffff",
    "--panel-alt": "#efe9ff",
    "--ink": "#231a3c",
    "--muted": "#5c5375",
    "--border": "rgba(35, 26, 60, 0.12)",
    "--primary": "#6d58d6",
    "--primary-soft": "#eeebff",
    "--accent": "#ff7aa2",
    "--accent-soft": "#ffe5ef",
    "--success": "#2a9d7f",
    "--shadow": "0 18px 44px rgba(98, 81, 164, 0.12)",
  },
};

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function getLocalDateString(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function startOfCurrentWeek(date = new Date()) {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = normalized.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  normalized.setDate(normalized.getDate() + diff);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function endOfCurrentWeek(date = new Date()) {
  const start = startOfCurrentWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getDayNameFromDate(dateString) {
  if (!dateString) return "Lun";
  const normalized = new Date(`${dateString}T12:00:00`);
  return fullWeekDays[normalized.getDay()];
}

function formatDisplayDate(dateString) {
  if (!dateString) return "Hoy";
  const value = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(value);
}

function parseTimeRangeToMinutes(timeLabel) {
  const [startTime] = timeLabel.split(" - ");
  const [hours, minutes] = startTime.split(":").map(Number);
  return hours * 60 + minutes;
}

function sortTimeLabels(timeLabels) {
  return [...timeLabels].sort((left, right) => parseTimeRangeToMinutes(left) - parseTimeRangeToMinutes(right));
}

function isPastTimeSlot(dateString, timeLabel) {
  if (!dateString || !timeLabel) return false;
  const todayString = getLocalDateString();
  if (dateString !== todayString) return false;
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  return parseTimeRangeToMinutes(timeLabel) <= nowMinutes;
}

function buildStableWeeklySchedule(classId) {
  const random = seededRandom(classId * 97 + 21);
  const offDays = new Set();

  if (classId % 2 === 0) offDays.add("Dom");
  if (classId % 3 === 0) offDays.add("Sáb");
  if (classId % 5 === 0) offDays.add("Vie");

  const extraOffDays = ["Lun", "Mar", "Mié", "Jue", "Vie"];
  const extraOffCount = 1 + Math.floor(random() * 2);
  for (let index = 0; index < extraOffCount; index += 1) {
    const day = extraOffDays[Math.floor(random() * extraOffDays.length)];
    offDays.add(day);
  }

  const availableDays = fullWeekDays.filter((day) => !offDays.has(day));
  if (availableDays.length === 0) {
    availableDays.push("Lun", "Mié", "Vie");
  }

  const slotsByDay = {};
  const slotsPerDay = 3 + Math.floor(random() * 4);
  const shuffledPool = [...dailyTimeSlots].sort(() => random() - 0.5);

  availableDays.forEach((day) => {
    const chosenTimes = shuffledPool.slice(0, Math.min(slotsPerDay, shuffledPool.length));
    slotsByDay[day] = sortTimeLabels(chosenTimes);
  });

  const schedule = availableDays.flatMap((day) => slotsByDay[day].map((time) => ({ day, time })));

  return {
    availableDays,
    slotsByDay,
    offDays: [...offDays],
    schedule,
  };
}

function getDatesForClass(classItem) {
  const today = new Date();
  const start = startOfCurrentWeek(today);
  const end = endOfCurrentWeek(today);
  const dates = [];

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const dateString = getLocalDateString(cursor);
    const dayName = getDayNameFromDate(dateString);
    if ((classItem.availableDays || []).includes(dayName) && new Date(`${dateString}T00:00:00`) >= new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      dates.push(dateString);
    }
  }

  return dates;
}

function countSessionsRemainingThisMonth() {
  const today = new Date();
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
  let total = 0;

  for (let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate()); cursor <= monthEnd; cursor.setDate(cursor.getDate() + 1)) {
    const dateString = getLocalDateString(cursor);
    const dayName = getDayNameFromDate(dateString);

    classes.forEach((classItem) => {
      if (!(classItem.availableDays || []).includes(dayName)) return;
      total += getSlotsForDate(classItem, dateString).length;
    });
  }

  return total;
}

function getSlotsForDate(classItem, dateString) {
  if (!dateString || !classItem) return [];

  const dayName = getDayNameFromDate(dateString);
  const todayString = getLocalDateString();
  const slots = classItem.slotsByDay?.[dayName] || [];

  if (dateString !== todayString) {
    return slots;
  }

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  return slots.filter((timeLabel) => parseTimeRangeToMinutes(timeLabel) > nowMinutes);
}

classes.forEach((classItem) => {
  const generated = buildStableWeeklySchedule(classItem.id);
  const location = workshopAddresses[classItem.id] || {
    address: "Avenida Revolución 100, Zona Centro, Tijuana, Baja California",
    mapUrl: buildMapUrlFromAddress("Avenida Revolución 100, Zona Centro, Tijuana, Baja California"),
  };
  classItem.address = location.address;
  classItem.mapUrl = location.mapUrl;
  classItem.availableDays = generated.availableDays;
  classItem.slotsByDay = generated.slotsByDay;
  classItem.schedule = generated.schedule;
  classItem.offDays = generated.offDays;
});

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((value) => value + value).join('')
    : normalized;
  const number = Number.parseInt(full, 16);
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  };
}

function mixWithWhite(hex, amount = 0.5) {
  const rgb = hexToRgb(hex);
  const blend = (channel) => Math.round(channel + (255 - channel) * amount);
  return `rgb(${blend(rgb.r)}, ${blend(rgb.g)}, ${blend(rgb.b)})`;
}

function mixWithBlack(hex, amount = 0.28) {
  const rgb = hexToRgb(hex);
  const blend = (channel) => Math.round(channel * (1 - amount));
  return `rgb(${blend(rgb.r)}, ${blend(rgb.g)}, ${blend(rgb.b)})`;
}

function buildCustomTheme(primaryColor) {
  const base = primaryColor || '#2f4bb5';
  return {
    "--bg": mixWithBlack(base, 0.12),
    "--panel": mixWithWhite(base, 0.9),
    "--panel-alt": mixWithWhite(base, 0.82),
    "--ink": mixWithBlack(base, 0.7),
    "--muted": mixWithBlack(base, 0.42),
    "--border": `${mixWithBlack(base, 0.75)}66`,
    "--primary": base,
    "--primary-soft": mixWithWhite(base, 0.88),
    "--accent": mixWithBlack(base, 0.18),
    "--accent-soft": mixWithWhite(base, 0.72),
    "--success": "#1f8a5a",
    "--shadow": "0 18px 44px rgba(28, 35, 60, 0.08)",
  };
}

function App() {
  const [role, setRole] = useState("student");
  const [theme, setTheme] = useState("classic");
  const [customColor, setCustomColor] = useState("#2f4bb5");
  const [selectedClassId, setSelectedClassId] = useState(classes[0].id);
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState("signup");
  const [activeCategory, setActiveCategory] = useState("Todo");
  const [bookingForm, setBookingForm] = useState({
    name: "",
    email: "",
    guests: "2",
    date: "",
    time: "",
  });
  const [accountForm, setAccountForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "student",
  });
  const [statusBanner, setStatusBanner] = useState({ type: "", text: "" });
  const [authStatusBanner, setAuthStatusBanner] = useState({ type: "", text: "" });
  const [bookingStatusBanner, setBookingStatusBanner] = useState({ type: "", text: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [profileForm, setProfileForm] = useState({ full_name: "", role: "student" });
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [latestBooking, setLatestBooking] = useState(null);

  const activeUserName = session?.user?.user_metadata?.full_name || profile?.full_name || accountForm.fullName || bookingForm.name || "Usuario";
  const activeUserEmail = session?.user?.email || profile?.email || accountForm.email || bookingForm.email || "";
  const canBook = Boolean(session);
  const activeTheme = theme === "custom" ? buildCustomTheme(customColor) : themeStyles[theme] || themeStyles.classic;
  const classesThisMonth = useMemo(() => countSessionsRemainingThisMonth(), []);
  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) ?? classes[0],
    [selectedClassId]
  );
  const selectedClassDates = useMemo(() => getDatesForClass(selectedClass), [selectedClass]);
  const availableBookingTimes = useMemo(() => getSlotsForDate(selectedClass, bookingForm.date), [selectedClass, bookingForm.date]);
  const visibleSchedule = useMemo(() => {
    const dayName = bookingForm.date ? getDayNameFromDate(bookingForm.date) : null;
    if (!dayName) return [...selectedClass.schedule].sort((left, right) => parseTimeRangeToMinutes(left.time) - parseTimeRangeToMinutes(right.time));
    return selectedClass.schedule
      .filter((slot) => slot.day === dayName)
      .sort((left, right) => parseTimeRangeToMinutes(left.time) - parseTimeRangeToMinutes(right.time));
  }, [selectedClass, bookingForm.date]);

  const goToAvailableDate = (direction) => {
    if (!selectedClassDates.length) return;
    const numericIndex = selectedClassDates.indexOf(bookingForm.date);
    const targetIndex = numericIndex >= 0 ? numericIndex + direction : 0;
    const nextDate = selectedClassDates[Math.max(0, Math.min(selectedClassDates.length - 1, targetIndex))];
    setBookingForm((current) => ({ ...current, date: nextDate, time: getSlotsForDate(selectedClass, nextDate)[0] || "" }));
  };

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(activeTheme).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [activeTheme]);

  useEffect(() => {
    const fallbackDate = selectedClassDates[0] || "";
    const validDate = fallbackDate && bookingForm.date ? selectedClassDates.includes(bookingForm.date) ? bookingForm.date : fallbackDate : fallbackDate;
    const validTimeOptions = getSlotsForDate(selectedClass, validDate);

    setBookingForm((current) => {
      const nextTime = validTimeOptions.includes(current.time) ? current.time : validTimeOptions[0] || "";

      if (current.date === validDate && current.time === nextTime) {
        return current;
      }

      return {
        ...current,
        date: validDate,
        time: nextTime,
      };
    });
  }, [selectedClass, selectedClassDates, bookingForm.date, bookingForm.time]);

  const filteredClasses =
    activeCategory === "Todo"
      ? classes
      : classes.filter((item) => item.category === activeCategory);

  useEffect(() => {
    if (!supabase) return undefined;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const refreshUserData = async () => {
    if (!supabase || !session?.user?.id) {
      setProfile(null);
      setRecentBookings([]);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    if (!profileError && profileData) {
      setProfile(profileData);
      setProfileForm({
        full_name: profileData.full_name || session.user.user_metadata?.full_name || "",
        role: profileData.role || session.user.user_metadata?.role || "student",
      });
    }

    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!bookingsError) {
      setRecentBookings(bookingsData || []);
    }
  };

  useEffect(() => {
    if (!supabase || !session?.user?.id) {
      setProfile(null);
      setRecentBookings([]);
      return undefined;
    }

    refreshUserData();
    return undefined;
  }, [session]);

  useEffect(() => {
    if (!filteredClasses.some((item) => item.id === selectedClassId)) {
      setSelectedClassId(filteredClasses[0]?.id ?? classes[0].id);
    }
  }, [filteredClasses, selectedClassId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setBookingForm((current) => ({ ...current, [name]: value }));
    updateFieldErrorState(name, value);
  };

  const handleAccountChange = (event) => {
    const { name, value } = event.target;
    setAccountForm((current) => ({ ...current, [name]: value }));
    updateFieldErrorState(name, value);
  };

  const handleProfileFormChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
    updateFieldErrorState(name, value);
  };

  const setStatusMessage = (type, text) => {
    setStatusBanner({ type, text });
  };

  const setAuthStatusMessage = (type, text) => {
    setAuthStatusBanner({ type, text });
  };

  const setBookingStatusMessage = (type, text) => {
    setBookingStatusBanner({ type, text });
  };

  const formatAuthErrorMessage = (mode, rawMessage = "") => {
    const message = String(rawMessage || "").toLowerCase();

    if (mode === "signin") {
      if (message.includes("invalid login credentials") || message.includes("wrong password") || message.includes("password") || message.includes("auth/invalid-password")) {
        return "This email is associated with an account, but the password is incorrect. Please try again.";
      }

      if (message.includes("user not found") || message.includes("no user") || message.includes("email not found") || message.includes("not found") || message.includes("auth/user-not-found")) {
        return "No account was found for this email. Please create an account first.";
      }

      if (message.includes("email")) {
        return "Please check the email address you entered and try again.";
      }

      return "We couldn't sign you in. Please check your credentials and try again.";
    }

    if (message.includes("already registered") || message.includes("already exists") || message.includes("user already") || message.includes("auth/user-already-exists")) {
      return "An account with this email already exists. Please sign in instead.";
    }

    if (message.includes("invalid email") || message.includes("email") || message.includes("auth/invalid-email")) {
      return "Please enter a valid email address.";
    }

    if (message.includes("password") || message.includes("auth/weak-password") || message.includes("passwords do not match")) {
      return "Password must be at least 6 characters long.";
    }

    return "We couldn't create your account. Please review the information and try again.";
  };

  const updateFieldErrorState = (fieldName, value) => {
    setFieldErrors((current) => {
      const next = { ...current };
      if (!value || !String(value).trim()) {
        next[fieldName] = true;
      } else {
        delete next[fieldName];
      }
      return next;
    });
  };

  const validateRequiredFields = (fields) => {
    const nextErrors = {};
    let hasMissing = false;

    fields.forEach(({ name, value }) => {
      if (!String(value ?? "").trim()) {
        nextErrors[name] = true;
        hasMissing = true;
      }
    });

    setFieldErrors((current) => ({
      ...current,
      ...nextErrors,
    }));

    return !hasMissing;
  };

  const clearFieldErrors = () => setFieldErrors({});

  const validateBookingFields = () => {
    const requiredFields = [
      { name: "name", value: bookingForm.name },
      { name: "email", value: bookingForm.email },
      { name: "date", value: bookingForm.date },
      { name: "time", value: bookingForm.time },
    ];

    const isValid = validateRequiredFields(requiredFields);
    if (!isValid) {
      setBookingStatusMessage("error", "Please complete all required booking fields before confirming.");
    }

    return isValid;
  };

  const handleProfileSave = async () => {
    if (!session || !supabase) {
      setStatusMessage("error", "Inicia sesión para editar tu perfil.");
      return;
    }

    if (!validateRequiredFields([{ name: "full_name", value: profileForm.full_name }])) {
      setStatusMessage("error", "Please complete the required profile field before saving.");
      return;
    }

    setIsSaving(true);
    setStatusMessage("", "");

    try {
      const authUpdate = await supabase.auth.updateUser({
        data: {
          full_name: profileForm.full_name.trim(),
          role: profileForm.role,
        },
      });

      if (authUpdate.error) {
        throw authUpdate.error;
      }

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: session.user.id,
          full_name: profileForm.full_name.trim(),
          email: session.user.email,
          role: profileForm.role,
          created_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      await refreshUserData();
      setStatusMessage("success", "Perfil actualizado correctamente.");
    } catch (error) {
      console.error("Profile update error:", error);
      setStatusMessage("error", error?.message || "No se pudo actualizar el perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAuthSubmit = async () => {
    const requiredFields = authMode === "signup"
      ? [
          { name: "fullName", value: accountForm.fullName },
          { name: "email", value: accountForm.email },
          { name: "password", value: accountForm.password },
        ]
      : [
          { name: "email", value: accountForm.email },
          { name: "password", value: accountForm.password },
        ];

    setStatusBanner({ type: "", text: "" });
    setBookingStatusBanner({ type: "", text: "" });
    setAuthStatusBanner({ type: "", text: "" });

    if (!validateRequiredFields(requiredFields)) {
      setAuthStatusMessage("error", "Please fill in all required fields before continuing.");
      return;
    }

    const emailValue = accountForm.email.trim();
    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);

    if (!emailIsValid) {
      setAuthStatusMessage("error", "Please enter a valid email address.");
      return;
    }

    if (accountForm.password.length < 6) {
      setAuthStatusMessage("error", "Password must be at least 6 characters long.");
      return;
    }

    if (!supabase) {
      setAuthStatusMessage("error", "Supabase is not configured in this browser.");
      return;
    }

    setIsSaving(true);
    setAuthStatusMessage("", "");

    try {
      let authResult;

      if (authMode === "signup") {
        authResult = await supabase.auth.signUp({
          email: emailValue,
          password: accountForm.password,
          options: {
            data: {
              full_name: accountForm.fullName.trim(),
              role: accountForm.role,
            },
          },
        });

        if (authResult.error) {
          throw new Error(formatAuthErrorMessage("signup", authResult.error.message));
        }

        if (authResult.data.user) {
          const profileResult = await upsertProfileFromAuth(authResult.data.user, accountForm.role);
          if (!profileResult.ok) {
            console.warn("Profile sync failed:", profileResult.error);
          }
        }

        setBookingForm((current) => ({
          ...current,
          name: accountForm.fullName.trim(),
          email: emailValue,
        }));

        setAuthStatusMessage(
          "success",
          isServiceRoleKey
            ? "Account created. This is a demo setup using a service-role key; replace it with an anon key before production."
            : "Account created. Check your email to confirm sign-up."
        );
      } else {
        authResult = await supabase.auth.signInWithPassword({
          email: emailValue,
          password: accountForm.password,
        });

        if (authResult.error) {
          throw new Error(formatAuthErrorMessage("signin", authResult.error.message));
        }

        const userName = authResult.data.user?.user_metadata?.full_name || accountForm.fullName || "";
        setBookingForm((current) => ({
          ...current,
          name: userName || current.name,
          email: authResult.data.user?.email || current.email,
        }));

        setAuthStatusMessage(
          "success",
          isServiceRoleKey
            ? "Signed in successfully. Demo mode is active; use a secure anon key in production."
            : "Signed in successfully."
        );
      }

      clearFieldErrors();

      if (authMode === "signup") {
        setAccountForm({ fullName: "", email: "", password: "", role: "student" });
      } else {
        setAccountForm((current) => ({ ...current, password: "" }));
      }
    } catch (error) {
      console.error("Auth error:", error);
      setAuthStatusMessage("error", error?.message || "Unable to complete authentication.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setAuthStatusMessage("success", "Signed out successfully.");
  };

  const handleBookingSubmit = async () => {
    setAuthStatusBanner({ type: "", text: "" });

    if (!session) {
      setBookingStatusMessage("error", "Inicia sesión para confirmar una reserva.");
      return;
    }

    if (!validateBookingFields()) {
      return;
    }

    if (!selectedClassDates.includes(bookingForm.date)) {
      setBookingStatusMessage("error", "La fecha seleccionada no está disponible para esta clase.");
      return;
    }

    if (!getSlotsForDate(selectedClass, bookingForm.date).includes(bookingForm.time)) {
      setBookingStatusMessage("error", "El horario seleccionado ya no está disponible.");
      return;
    }

    setIsSaving(true);
    setBookingStatusMessage("", "");

    try {
      let result;

      if (editingBookingId) {
        const { error } = await supabase
          .from("bookings")
          .update({
            name: bookingForm.name.trim(),
            email: bookingForm.email.trim(),
            guests: Number(bookingForm.guests),
            booking_date: bookingForm.date,
            booking_time: bookingForm.time,
            class_title: selectedClass.title,
            class_category: selectedClass.category,
            price: selectedClass.price,
          })
          .eq("id", editingBookingId)
          .eq("user_id", session.user.id);

        if (error) throw error;
        result = { ok: true };
      } else {
        result = await saveToSupabase("bookings", {
          user_id: session.user.id,
          name: bookingForm.name.trim(),
          email: bookingForm.email.trim(),
          guests: Number(bookingForm.guests),
          booking_date: bookingForm.date,
          booking_time: bookingForm.time,
          class_title: selectedClass.title,
          class_category: selectedClass.category,
          price: selectedClass.price,
          created_at: new Date().toISOString(),
        });
      }

      if (result.ok) {
        const confirmation = {
          title: selectedClass.title,
          date: bookingForm.date,
          guests: Number(bookingForm.guests),
          category: selectedClass.category,
          price: selectedClass.price,
        };

        clearFieldErrors();
        setLatestBooking(confirmation);
        await refreshUserData();
        setEditingBookingId(null);
        setBookingStatusMessage(
          "success",
          editingBookingId ? "Reserva actualizada correctamente." : `Reserva confirmada para ${selectedClass.title}.`
        );
      } else {
        setBookingStatusMessage("error", "Reservation could not be saved. Check your Supabase configuration.");
      }
    } catch (error) {
      console.error("Booking save error:", error);
      setBookingStatusMessage("error", error?.message || "No se pudo guardar la reserva.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditBooking = (booking) => {
    setEditingBookingId(booking.id);
    setBookingForm({
      name: booking.name,
      email: booking.email,
      guests: String(booking.guests),
      date: booking.booking_date || "",
      time: booking.booking_time || "",
    });

    const classMatch = classes.find((item) => item.title === booking.class_title);
    if (classMatch) {
      setSelectedClassId(classMatch.id);
    }

    setBookingStatusMessage("success", `Editando la reserva de ${booking.class_title}.`);
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!supabase || !session) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", bookingId)
        .eq("user_id", session.user.id);

      if (error) throw error;
      await refreshUserData();
      setBookingStatusMessage("success", "Reserva eliminada correctamente.");
    } catch (error) {
      console.error("Delete booking error:", error);
      setBookingStatusMessage("error", error?.message || "No se pudo eliminar la reserva.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app-shell" style={activeTheme}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">K</div>
          <span>Klasso</span>
        </div>

        <div className="top-actions">
          <nav className="nav" aria-label="Main navigation">
            {roleOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`nav-button ${role === option ? "active" : ""}`}
                onClick={() => setRole(option)}
              >
                {option === "student" ? "Estudiante" : option === "instructor" ? "Instructor" : "Anfitrión"}
              </button>
            ))}
          </nav>

          <div className="theme-switcher" aria-label="Theme switcher">
            {themeOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`theme-button ${theme === option.id ? "active" : ""}`}
                onClick={() => setTheme(option.id)}
              >
                {option.label}
              </button>
            ))}
            {theme === "custom" && (
              <label className="color-picker-wrap" aria-label="Select custom theme color">
                <input
                  type="color"
                  value={customColor}
                  onChange={(event) => setCustomColor(event.target.value)}
                />
              </label>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">Nuevo · espacio creativo</span>
              <h1>Encuentra el lugar perfecto para enseñar, aprender y crear.</h1>
              <p>
                Conectamos anfitriones, instructores y estudiantes para organizar clases y reservas sin fricción,
                con un flujo claro y una experiencia fácil de administrar.
              </p>

              <div className="hero-actions">
                <button type="button" className="primary-button">Comenzar</button>
                <button type="button" className="secondary-button">Ver cómo funciona</button>
              </div>
            </div>

            <div className="hero-lower-row">
              <div className="panel auth-panel">
                {isServiceRoleKey && (
                  <div className="status-message error" role="alert">
                    Demo mode: your Supabase key looks like a service-role credential. Replace it with an anon key and secure your tables before production.
                  </div>
                )}

                <div className="session-summary">
                  {session ? (
                    <>
                      <span className="session-pill success">Sesión activa</span>
                      <strong>{activeUserName}</strong>
                      <small>{activeUserEmail}</small>
                    </>
                  ) : (
                    <>
                      <span className="session-pill neutral">Sin sesión</span>
                      <strong>Haz login para reservar</strong>
                    </>
                  )}
                </div>

                <div className="auth-header">
                  <h3>{authMode === "signup" ? "Crear cuenta" : "Iniciar sesión"}</h3>
                  <div className="auth-toggle">
                    <button type="button" className={authMode === "signup" ? "toggle-active" : ""} onClick={() => setAuthMode("signup")}>Registrarse</button>
                    <button type="button" className={authMode === "signin" ? "toggle-active" : ""} onClick={() => setAuthMode("signin")}>Ingresar</button>
                  </div>
                </div>

                <div className="booking-box">
                  {authMode === "signup" && (
                    <div className="field">
                      <label htmlFor="fullName">Nombre completo</label>
                      <input
                        id="fullName"
                        name="fullName"
                        value={accountForm.fullName}
                        onChange={handleAccountChange}
                        placeholder="Tu nombre"
                        className={fieldErrors.fullName ? "input-invalid" : ""}
                        aria-invalid={Boolean(fieldErrors.fullName)}
                      />
                    </div>
                  )}

                  <div className="field">
                    <label htmlFor="accountEmail">Correo</label>
                    <input
                      id="accountEmail"
                      name="email"
                      type="email"
                      value={accountForm.email}
                      onChange={handleAccountChange}
                      placeholder="tu@correo.com"
                      className={fieldErrors.email ? "input-invalid" : ""}
                      aria-invalid={Boolean(fieldErrors.email)}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="accountPassword">Contraseña</label>
                    <input
                      id="accountPassword"
                      name="password"
                      type="password"
                      value={accountForm.password}
                      onChange={handleAccountChange}
                      placeholder="••••••••"
                      className={fieldErrors.password ? "input-invalid" : ""}
                      aria-invalid={Boolean(fieldErrors.password)}
                    />
                  </div>

                  {authMode === "signup" && (
                    <div className="field">
                      <label htmlFor="accountRole">Tipo de perfil</label>
                      <select id="accountRole" name="role" value={accountForm.role} onChange={handleAccountChange}>
                        <option value="student">Estudiante</option>
                        <option value="instructor">Instructor</option>
                        <option value="host">Anfitrión</option>
                      </select>
                    </div>
                  )}

                  {authStatusBanner.text && (
                    <div className={`status-message ${authStatusBanner.type}`} aria-live="polite" role="status">
                      <p>{authStatusBanner.text}</p>
                    </div>
                  )}

                  <button type="button" className="primary-button" onClick={handleAuthSubmit} disabled={isSaving}>
                    {isSaving ? "Guardando..." : authMode === "signup" ? "Crear cuenta" : "Ingresar"}
                  </button>

                  {session && (
                    <button type="button" className="secondary-button" onClick={handleSignOut}>
                      Cerrar sesión
                    </button>
                  )}
                </div>
              </div>

              <aside className="metric-panel" aria-label="Summary metrics">
                <div className="metric-header">
                  <h3>Resumen</h3>
                  <span className="badge success">En línea</span>
                </div>

                <div className="metric-list">
                  <div className="metric-row">
                    <span className="metric-label">Espacios activos</span>
                    <span className="metric-value">{classes.length}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Clases este mes</span>
                    <span className="metric-value">{classesThisMonth}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Tasa de respuesta</span>
                    <span className="metric-value">{session ? "100%" : "96%"}</span>
                  </div>
                </div>

                {latestBooking && (
                  <div className="booking-confirmation-card" style={{ marginTop: 18 }}>
                    <span className="mini-label">Última reserva</span>
                    <strong>{latestBooking.title}</strong>
                    <small>{latestBooking.date}</small>
                    <span>{latestBooking.guests} personas</span>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="section-header">
            <h2>Clases disponibles</h2>
            <div className="filter-bar" aria-label="Class filters">
              {categoryOptions.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`select-button ${activeCategory === category ? "selected" : ""}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="card-grid">
            {filteredClasses.map((item) => (
              <article
                key={item.id}
                className={`class-card ${item.id === selectedClass.id ? "selected" : ""}`}
                onClick={() => setSelectedClassId(item.id)}
              >
                <div className="class-art" style={{ background: getCategoryColor(item.category, item.id) }}>
                  {item.category}
                </div>

                <div className="class-body">
                  <div className="meta-row">
                    <span className="meta-tag">{item.category}</span>
                    <span className="rating">★ {item.rating}</span>
                  </div>

                  <h3>{item.title}</h3>
                  <p>{item.description}</p>

                  <div className="class-footer">
                    <div className="price">
                      ${item.price}
                      <small>/ sesión</small>
                    </div>
                    <button
                      type="button"
                      className="action-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedClassId(item.id);
                      }}
                    >
                      Reservar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="detail-area">
            <aside className="panel">
              <h3>{editingBookingId ? "Actualizar reserva" : "Reservar ahora"}</h3>

              <div className="booking-box">
                <div className="field">
                  <label htmlFor="name">Nombre</label>
                  <input id="name" name="name" value={bookingForm.name} onChange={handleChange} placeholder="Tu nombre" className={fieldErrors.name ? "input-invalid" : ""} aria-invalid={Boolean(fieldErrors.name)} />
                </div>

                <div className="field">
                  <label htmlFor="email">Correo</label>
                  <input id="email" name="email" type="email" value={bookingForm.email} onChange={handleChange} placeholder="tu@correo.com" className={fieldErrors.email ? "input-invalid" : ""} aria-invalid={Boolean(fieldErrors.email)} />
                </div>

                <div className="field">
                  <label htmlFor="guests">Participantes</label>
                  <select id="guests" name="guests" value={bookingForm.guests} onChange={handleChange}>
                    <option value="1">1 persona</option>
                    <option value="2">2 personas</option>
                    <option value="3">3 personas</option>
                    <option value="4">4 personas</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="date">Fecha</label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    min={getLocalDateString()}
                    max={selectedClassDates[selectedClassDates.length - 1] || getLocalDateString(endOfCurrentWeek())}
                    value={bookingForm.date}
                    onChange={handleChange}
                    className={fieldErrors.date ? "input-invalid" : ""}
                    aria-invalid={Boolean(fieldErrors.date)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="time">Hora</label>
                  <select id="time" name="time" value={bookingForm.time} onChange={handleChange} className={fieldErrors.time ? "input-invalid" : ""} aria-invalid={Boolean(fieldErrors.time)}>
                    {availableBookingTimes.length > 0 ? (
                      availableBookingTimes.map((timeLabel) => (
                        <option key={timeLabel} value={timeLabel}>{timeLabel}</option>
                      ))
                    ) : (
                      <option value="">Sin horarios disponibles</option>
                    )}
                  </select>
                </div>

                <div className="summary-card">
                  <h4>{selectedClass.title}</h4>
                  <p>
                    <strong>{selectedClass.level}</strong> · {selectedClass.category} · ${selectedClass.price} MXN
                  </p>
                </div>

                <button type="button" className="primary-button" onClick={handleBookingSubmit} disabled={isSaving || !canBook}>
                  {isSaving
                    ? "Guardando..."
                    : !canBook
                      ? "Inicia sesión para reservar"
                      : editingBookingId
                        ? "Actualizar reserva"
                        : "Confirmar reserva"}
                </button>

                {latestBooking && (
                  <div className="booking-confirmation-card compact" style={{ marginTop: 12 }}>
                    <span className="mini-label">Confirmado</span>
                    <strong>{latestBooking.title}</strong>
                    <small>{latestBooking.date} · {latestBooking.guests} personas</small>
                  </div>
                )}

                {editingBookingId && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setEditingBookingId(null);
                      setStatusMessage("success", "Edición cancelada.");
                    }}
                  >
                    Cancelar edición
                  </button>
                )}

                {bookingStatusBanner.text && (
                  <div className={`status-message ${bookingStatusBanner.type}`} aria-live="polite" role="status">
                    <p>{bookingStatusBanner.text}</p>
                  </div>
                )}
              </div>
            </aside>

            <section className="panel">
              <h3>Horario sugerido</h3>
              <div className="date-nav" aria-label="Available class days">
                <button type="button" className="date-nav-button" onClick={() => goToAvailableDate(-1)} aria-label="Previous available day">←</button>
                {selectedClassDates.map((dateValue) => (
                  <button
                    key={dateValue}
                    type="button"
                    className={`date-pill ${bookingForm.date === dateValue ? "selected" : ""}`}
                    aria-pressed={bookingForm.date === dateValue}
                    onClick={() => {
                      const nextTime = getSlotsForDate(selectedClass, dateValue)[0] || "";
                      setBookingForm((current) => ({
                        ...current,
                        date: dateValue,
                        time: nextTime,
                      }));
                    }}
                  >
                    {dateValue === getLocalDateString() ? "Hoy" : dateValue === getLocalDateString(new Date(Date.now() + 86400000)) ? "Mañana" : formatDisplayDate(dateValue)}
                  </button>
                ))}
                <button type="button" className="date-nav-button" onClick={() => goToAvailableDate(1)} aria-label="Next available day">→</button>
              </div>

              <ul className="schedule-list">
                {visibleSchedule.length > 0 ? (
                  visibleSchedule.map((slot) => {
                    const isSelectedTime = bookingForm.time === slot.time;
                    const isPastSlot = isPastTimeSlot(bookingForm.date, slot.time);
                    return (
                      <li key={`${selectedClass.id}-${slot.day}-${slot.time}`}>
                        <button
                          type="button"
                          className={`schedule-item ${isSelectedTime ? "selected" : ""} ${isPastSlot ? "past" : ""}`}
                          aria-pressed={isSelectedTime}
                          disabled={isPastSlot}
                          onClick={() => {
                            if (isPastSlot) return;
                            setBookingForm((current) => ({
                              ...current,
                              date: current.date || selectedClassDates[0] || "",
                              time: slot.time,
                            }));
                          }}
                        >
                          <strong>{slot.day}</strong>
                          <span>{isPastSlot ? `${slot.time} · Pasado` : slot.time}</span>
                        </button>
                      </li>
                    );
                  })
                ) : (
                  <p className="empty-state">No hay horarios disponibles para esta fecha.</p>
                )}
              </ul>

              <div className="location-card" style={{ marginTop: 18 }}>
                <div className="location-header">
                  <h4>Ubicación</h4>
                  <span>{selectedClass.address}</span>
                </div>

                <div className="map-frame">
                  <iframe
                    title={`${selectedClass.title} location`}
                    src={selectedClass.mapUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);
