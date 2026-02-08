 PD_GLOB = r"C:\Users\tanne\Downloads\merged data\*\pdets*.csv"
  PL_GLOB = r"C:\Users\tanne\Downloads\merged data\*\plogs*.csv"
  con = duckdb.connect()

  query = f"""
  copy (
    with pdets as (
      select
        cast(problem_id as bigint) as problem_id,
        trim(skill) as skill_name
      from read_csv_auto('{PD_GLOB}', union_by_name=true)
      cross join unnest(
        string_split(
          replace(replace(replace(replace(skills, '[', ''), ']', ''), '''', ''), '"', ''),
          ','
        )
      ) as t(skill)
      where skills is not null and skills <> '' and skills <> '[]'
    ),
    plogs as (
      select
        cast(problem_id as bigint) as problem_id,
        correct
      from read_csv_auto('{PL_GLOB}', union_by_name=true)
      where correct in (0, 1)
    )
    select
      skill_name,
      avg(correct)::double as prior_mastery
    from plogs
    join pdets using (problem_id)
    where skill_name is not null and skill_name <> ''
    group by skill_name
  ) to '{OUT_CSV}' (header, delimiter ',');
  """

  con.execute(query)
  print("Wrote:", OUT_CSV)