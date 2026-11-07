/* down · undoes 0019: gifts go back to giving no answer (acceptance, reaction and edit marks are
   dropped; a used coupon stays used) and the notification subscriptions are deleted. */

begin;

drop table aviso;
drop trigger regalo_fijo_al_abrir on regalo;
drop function regalo_fijo_al_abrir();
alter table regalo
  drop constraint regalo_usa_aceptado,
  drop constraint regalo_reaccion,
  drop constraint regalo_acepta_abierto,
  drop column avisado_listo_en,
  drop column editado_en,
  drop column reaccion,
  drop column aceptado_en;

delete from migracion where version = -19;   -- undone before: one mark is enough
update migracion set version = -19, aplicada_en = now() where version = 19;   -- «19, undone»: the record stays

commit;
