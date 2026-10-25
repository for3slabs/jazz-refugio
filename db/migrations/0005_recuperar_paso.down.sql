/* down · undoes 0005: the reopen guard on steps goes away (no data is touched). */

begin;

drop trigger if exists limites_reabrir on paso;
update migracion set version = -5, aplicada_en = now() where version = 5;   -- «5, undone»: the record stays

commit;
