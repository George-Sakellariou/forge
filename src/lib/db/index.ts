import postgres from "postgres"

const connectionString =
  process.env.DATABASE_URL || "postgresql://forge:forge_local_dev@127.0.0.1:5432/forge"

const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
})

export default sql
