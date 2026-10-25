/* down · undoes 0011: the index goes, so two boards may share a name again. The boards it let go
   stay let go — «deshacer» or «lo que soltaste» brings them back, as with any. */

begin;

drop index if exists tablero_nombre_unico;

update migracion set version = -11, aplicada_en = now() where version = 11;   -- «11, undone»: the record stays

commit;
