// One-off: her data from the Blob JSON files into the Postgres rows (block base-de-datos, sub-block 2).
//
//   node --env-file=<a .env with BLOB_READ_WRITE_TOKEN> db/copiar-blob.mjs
//   env: DATABASE_URL (direct host) · DB_SCHEMA (optional, e.g. dev) · FUENTE=prod|dev (which Blob files)
//
// Prints counts only — never her content. Refuses when the target already holds her data, so it
// can neither duplicate nor overwrite. One transaction: the whole copy, or nothing. Original ids are
// kept, so a mission still points at its goal step. The Blob files are only read.
import { get } from "@vercel/blob";
import postgres from "postgres";

const prod = (process.env.FUENTE ?? "prod") === "prod";
const P = (prodPath, devPath) => (prod ? prodPath : devPath);
const RUTAS = {
  estado: P("estado/estado.json", "estado/dev.json"),
  misiones: P("misiones/misiones.json", "misiones/dev.json"),
  pendientes: P("pendientes/pendientes.json", "pendientes/dev.json"),
  notas: P("notas/notas.json", "notas/dev.json"),
  regalos: P("regalos/regalos.json", "regalos/dev.json"),
  presente: P("presente/presente.json", "presente/dev.json"),
  coleccion: P("coleccion/coleccion.json", "coleccion/dev.json"),
  mascota: P("mascota/mascota.json", "mascota/dev.json"),
  regalados: P("mascota/regalados.json", "mascota/regalados-dev.json"),
  legado: P("personajes/regalados.json", "personajes/dev.json"),
  lienzo: P("lienzo/tableros.json", "lienzo-dev/tableros.json"),
};
const DEL_LEGADO = { mariachi: "sombrero", chef: "gorro-chef" };

async function leer(path) {
  const res = await get(path, { access: "private", useCache: false });
  if (!res?.stream) return null; // never written: nothing to copy
  return JSON.parse(await new Response(res.stream).text()); // unreadable = the copy stops here
}

const url = process.env.DATABASE_URL.replace("-pooler.", ".");
const schema = process.env.DB_SCHEMA;
const sql = postgres(url, { prepare: false, max: 1, ...(schema && { connection: { options: `-c search_path=${schema}` } }) });
const at = (n) => (Number.isFinite(n) ? new Date(n) : new Date());
const fuente = {};
const copiado = {};
const cuenta = (k, n = 1) => (copiado[k] = (copiado[k] ?? 0) + n);

try {
  const datos = Object.fromEntries(await Promise.all(Object.entries(RUTAS).map(async ([k, p]) => [k, await leer(p)])));

  const [{ n: ya }] = await sql`
    select (select count(*) from mision) + (select count(*) from idea) + (select count(*) from meta)
         + (select count(*) from nota) + (select count(*) from regalo) + (select count(*) from respuesta)
         + (select count(*) from libro) + (select count(*) from viaje) + (select count(*) from aprendizaje)
         + (select count(*) from tablero) + (select count(*) from mascota) + (select count(*) from inventario)
         + (select count(*) from jardin_inicial) + (select count(*) from estado_actual) as n`;
  if (Number(ya) > 0) throw new Error(`the target already holds ${ya} rows of hers — refusing to copy over them`);

  await sql.begin(async (tx) => {
    // goals and their steps first: a mission may point at a step
    const pend = datos.pendientes ?? { mente: [], metas: [] };
    fuente.ideas = pend.mente?.length ?? 0;
    for (const i of pend.mente ?? []) {
      await tx`insert into idea (id, texto, anotada_en) values (${i.id}, ${i.texto}, ${at(i.at)})`;
      cuenta("ideas");
    }
    fuente.metas = pend.metas?.length ?? 0;
    fuente.pasos = 0;
    for (const m of pend.metas ?? []) {
      await tx`insert into meta (id, titulo, para, creada_en) values (${m.id}, ${m.titulo}, ${m.para ?? null}, ${at(m.at)})`;
      cuenta("metas");
      for (const [orden, p] of (m.pasos ?? []).entries()) {
        fuente.pasos++;
        await tx`insert into paso (id, meta_id, texto, orden, hecho_en)
                 values (${p.id}, ${m.id}, ${p.texto}, ${orden}, ${p.hecho ? at(p.hecho) : null})`;
        cuenta("pasos");
      }
    }

    const mis = datos.misiones ?? { abiertas: [], hechas: [], total: 0, mejorDia: 0 };
    fuente.abiertas = mis.abiertas?.length ?? 0;
    for (const m of mis.abiertas ?? []) {
      await tx`insert into mision (id, texto, paso_id, abierta_en) values (${m.id}, ${m.texto}, ${m.origen?.paso ?? null}, ${at(m.at)})`;
      cuenta("abiertas");
    }
    fuente.hechas = mis.hechas?.length ?? 0;
    for (const h of mis.hechas ?? []) {
      // a done mission may share its id with an open one in old data: a fresh id keeps both
      await tx`insert into mision (texto, abierta_en, hecha_en) values (${h.texto}, ${at(h.at)}, ${at(h.hecha)})`;
      cuenta("hechas");
    }
    // the flowers whose rows Blob had already deleted: carried as a starting count
    const inicial = Math.max(0, (mis.total ?? 0) - (mis.hechas?.length ?? 0));
    await tx`insert into jardin_inicial (persona, flores, mejor_dia) values ('jazz', ${inicial}, ${mis.mejorDia ?? 0})`;
    fuente.total = mis.total ?? 0;

    const est = datos.estado;
    fuente.estado = est ? 1 : 0;
    if (est?.modo) {
      await tx`insert into estado_actual (persona, modo, desde, vence)
               values ('jazz', ${est.modo}, ${at(est.at)}, ${at(est.at)}::timestamptz + interval '12 hours')`;
      cuenta("estado");
    }

    fuente.notas = datos.notas?.length ?? 0;
    for (const n of datos.notas ?? []) {
      await tx`insert into nota (id, de, para, texto, creada) values (${n.id}, 'brian', 'jazz', ${n.texto}, ${at(n.at)})`;
      cuenta("notas");
    }

    fuente.regalos = datos.regalos?.length ?? 0;
    for (const r of datos.regalos ?? []) {
      await tx`insert into regalo (id, de, para, tipo, titulo, texto, se_abre_con_flores, creado, abierto_en, usado_en)
               values (${r.id}, 'brian', 'jazz', ${r.tipo}, ${r.titulo}, ${r.texto}, ${r.desde ?? 0}, ${at(r.at)},
                       ${r.abierto ? at(r.abierto) : null}, ${r.usado ? at(r.usado) : null})`;
      cuenta("regalos");
    }

    const pre = datos.presente ?? { hasta: null, respuestas: {} };
    fuente.respuestas = 0;
    for (const [dia, v] of Object.entries(pre.respuestas ?? {})) {
      for (const persona of ["jazz", "brian"]) {
        if (!v?.[persona]) continue;
        fuente.respuestas++;
        await tx`insert into respuesta (dia, persona, texto, creada) values (${dia}, ${persona}, ${v[persona].texto}, ${at(v[persona].at)})`;
        cuenta("respuestas");
      }
    }
    if (pre.hasta) await tx`insert into presencia (persona, hasta) values ('brian', ${at(pre.hasta)})`;

    const col = datos.coleccion ?? { libros: [], aprendido: [], viajes: [] };
    fuente.libros = col.libros?.length ?? 0;
    for (const l of col.libros ?? []) {
      await tx`insert into libro (id, de, titulo, autor, nota, estado, creado)
               values (${l.id}, 'jazz', ${l.titulo}, ${l.autor ?? ""}, ${l.nota ?? ""}, ${l.estado ?? "quiero"}, ${at(l.at)})`;
      cuenta("libros");
    }
    fuente.aprendido = col.aprendido?.length ?? 0;
    for (const a of col.aprendido ?? []) {
      await tx`insert into aprendizaje (id, de, titulo, donde, nota, creado)
               values (${a.id}, 'jazz', ${a.titulo}, ${a.donde ?? ""}, ${a.nota ?? ""}, ${at(a.at)})`;
      cuenta("aprendido");
    }
    fuente.viajes = col.viajes?.length ?? 0;
    for (const v of col.viajes ?? []) {
      await tx`insert into viaje (id, de, lugar, cuando, nota, estado, creado)
               values (${v.id}, 'jazz', ${v.lugar}, ${v.cuando ?? ""}, ${v.nota ?? ""}, ${v.estado === "fui" ? "fui" : "quiero"}, ${at(v.at)})`;
      cuenta("viajes");
    }

    // what she has: the gifts (new and from the 2D characters), then what her garden brought
    const regalados = new Map();
    for (const r of datos.regalados ?? []) regalados.set(r.id, r.at);
    for (const r of datos.legado ?? []) if (DEL_LEGADO[r?.id] && !regalados.has(DEL_LEGADO[r.id])) regalados.set(DEL_LEGADO[r.id], r.at);
    fuente.regalados = regalados.size;
    for (const [id, cuando] of regalados) {
      await tx`insert into inventario (objeto_id, origen, llego_en) values (${id}, 'regalo', ${at(cuando)}) on conflict do nothing`;
      cuenta("regalados");
    }
    await tx`insert into inventario (objeto_id, origen)
             select o.id, case when o.flores_para_llegar = 0 then 'inicio' else 'jardin' end from objeto o, jardin j
             where o.activo and o.flores_para_llegar is not null and o.flores_para_llegar <= j.flores
             on conflict (objeto_id) do nothing`;

    const masc = datos.mascota;
    fuente.mascota = masc ? 1 : 0;
    if (masc) {
      const [m] = await tx`insert into mascota (nombre) values (${(masc.nombre ?? "michi").trim().slice(0, 20) || "michi"}) returning id`;
      cuenta("mascota");
      for (const [categoria, objeto] of Object.entries(masc.puestos ?? {})) {
        await tx`insert into puesto (mascota_id, categoria, objeto_id)
                 values (${m.id}, ${categoria}, (select i.objeto_id from inventario i join objeto o on o.id = i.objeto_id
                                                 where i.objeto_id = ${objeto} and o.categoria = ${categoria}))`;
        cuenta("puestos");
      }
    }

    fuente.tableros = datos.lienzo?.length ?? 0;
    fuente.items = 0;
    for (const t of datos.lienzo ?? []) {
      await tx`insert into tablero (id, nombre, compartido, creado) values (${t.id}, ${t.nombre}, ${t.compartido === true}, ${at(t.at)})`;
      cuenta("tableros");
      for (const i of t.items ?? []) {
        fuente.items++;
        await tx`insert into item (id, tablero_id, tipo, archivo, ancho, alto, color, texto, creado)
                 values (${i.id}, ${t.id}, ${i.tipo}, ${i.path ?? null}, ${i.w ?? null}, ${i.h ?? null},
                         ${i.color ?? null}, ${i.texto ?? null}, ${at(i.at)})`;
        cuenta("items");
      }
    }
  });

  console.log("entity        blob → rows");
  for (const k of Object.keys(fuente)) console.log(`${k.padEnd(13)} ${String(fuente[k]).padStart(4)} → ${copiado[k] ?? (k === "total" ? "(jardin_inicial)" : 0)}`);
  const [{ flores }] = await sql`select flores from jardin`;
  console.log(`garden        ${String(fuente.total).padStart(4)} → ${flores} (rows + jardin_inicial; her «volver» flowers arrive from her devices)`);
} finally {
  await sql.end();
}
