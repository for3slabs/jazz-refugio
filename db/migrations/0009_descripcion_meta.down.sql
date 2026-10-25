/* down · undoes 0009 without destroying anything: the column stays (dropping it would lose what
   she wrote); the app of 0008 does not read it. */

begin;

update migracion set version = -9, aplicada_en = now() where version = 9;   -- «9, undone»: the record stays

commit;
