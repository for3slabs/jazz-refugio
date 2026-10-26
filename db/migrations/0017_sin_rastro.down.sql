/* down · undoes 0017: every row it deleted or changed comes back from `respaldo_0017_*`, then the
   copy is dropped. A row already back (or recreated with the same id) is left as it is. */

begin;

insert into nota        select * from respaldo_0017_nota        on conflict do nothing;
insert into lectura     select * from respaldo_0017_lectura     on conflict do nothing;
insert into respuesta   select * from respaldo_0017_respuesta   on conflict do nothing;
insert into presencia   select * from respaldo_0017_presencia   on conflict do nothing;
insert into deseo       select * from respaldo_0017_deseo       where de = 'brian' on conflict do nothing;
update deseo d set regalado_en = r.regalado_en from respaldo_0017_deseo r where d.id = r.id and r.de = 'jazz';
insert into libro       select * from respaldo_0017_libro       where de = 'brian' on conflict do nothing;
update libro l set regalado_en = r.regalado_en from respaldo_0017_libro r where l.id = r.id and r.de = 'jazz';
insert into aprendizaje select * from respaldo_0017_aprendizaje on conflict do nothing;
insert into viaje       select * from respaldo_0017_viaje       where de = 'brian' on conflict do nothing;
update viaje v set regalado_en = r.regalado_en from respaldo_0017_viaje r where v.id = r.id and r.de = 'jazz';
insert into momento     select * from respaldo_0017_momento     on conflict do nothing;
update tablero set compartido = true where id in (select id from respaldo_0017_tablero);

drop table respaldo_0017_nota, respaldo_0017_lectura, respaldo_0017_respuesta, respaldo_0017_presencia,
  respaldo_0017_deseo, respaldo_0017_libro, respaldo_0017_aprendizaje, respaldo_0017_viaje,
  respaldo_0017_momento, respaldo_0017_tablero;

update migracion set version = -17, aplicada_en = now() where version = 17;   -- «17, undone»: the record stays

commit;
