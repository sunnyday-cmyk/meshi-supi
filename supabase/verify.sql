-- MeshiSpin: テーブル作成後の確認用（SQL Editor で実行）
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('sessions', 'members', 'votes', 'roulette_additions')
order by table_name;
