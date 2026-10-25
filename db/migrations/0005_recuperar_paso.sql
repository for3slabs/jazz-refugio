-- 0005 · «deshacer» brings a let-go step back, and the 12-steps limit must hold then too: 0001
-- counted it only on insert. The same guard every other let-go table already has on reopen.
-- Rollback: 0005_recuperar_paso.down.sql.

begin;

create trigger limites_reabrir after update of soltado_en on paso
  for each row when (new.soltado_en is null) execute function limites();

insert into migracion (version) values (5);

commit;
