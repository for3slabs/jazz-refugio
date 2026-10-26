-- 0017 · her refuge keeps nothing between the two but gifts (Brian, 2026-10-25: «es su lugar seguro
-- de ella … nada rastro mío y de comunicación», then «esa función de regalos sí déjala»). Deleted:
-- the notes and their «seen», the answers to the question of the day, «aquí estoy», the wishes Brian
-- sent her, his «ya se lo regalé» marks, his own shelf, trips and returns, and «compartido» on her
-- boards. Kept: the gifts both ways (`regalo`) and the objects he gave her pet (`inventario`).
-- Every row it deletes or changes is copied first into `respaldo_0017_*`, in the same schema
-- (Brian: «borrar ya pero deja una copia por si las dudas»).
-- Rollback: 0017_sin_rastro.down.sql (puts every row back from that copy).

begin;

create table respaldo_0017_nota        as select * from nota;
create table respaldo_0017_lectura     as select * from lectura;
create table respaldo_0017_respuesta   as select * from respuesta;
create table respaldo_0017_presencia   as select * from presencia;
create table respaldo_0017_deseo       as select * from deseo where de = 'brian' or regalado_en is not null;
create table respaldo_0017_libro       as select * from libro where de = 'brian' or regalado_en is not null;
create table respaldo_0017_aprendizaje as select * from aprendizaje where de = 'brian';
create table respaldo_0017_viaje       as select * from viaje where de = 'brian' or regalado_en is not null;
create table respaldo_0017_momento     as select * from momento where persona = 'brian';
create table respaldo_0017_tablero     as select id from tablero where compartido;

delete from lectura;
delete from nota;
delete from respuesta;
delete from presencia;
delete from deseo where de = 'brian';
update deseo set regalado_en = null where regalado_en is not null;
delete from libro where de = 'brian';
update libro set regalado_en = null where regalado_en is not null;
delete from aprendizaje where de = 'brian';
delete from viaje where de = 'brian';
update viaje set regalado_en = null where regalado_en is not null;
delete from momento where persona = 'brian';
update tablero set compartido = false where compartido;

insert into migracion (version) values (17);

commit;
