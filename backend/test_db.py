import asyncio
import asyncpg

async def test():
    # Try different username formats
    tests = [
        ("postgres.mgvuwfscuqocyzgloalq", "aws-0-ap-south-1.pooler.supabase.com", 6543),
        ("postgres", "db.mgvuwfscuqocyzgloalq.supabase.co", 5432),
        ("postgres.mgvuwfscuqocyzgloalq", "aws-0-ap-south-1.pooler.supabase.com", 5432),
    ]
    
    for user, host, port in tests:
        try:
            print(f"\nTrying: {user}@{host}:{port}...")
            conn = await asyncio.wait_for(
                asyncpg.connect(
                    user=user,
                    password="prince9572832405",
                    host=host,
                    port=port,
                    database="postgres",
                    statement_cache_size=0,
                    ssl="require",
                ),
                timeout=10,
            )
            result = await conn.fetchval("SELECT 1")
            print(f"  SUCCESS! Result: {result}")
            
            # Check if profiles table exists
            tables = await conn.fetch("SELECT tablename FROM pg_tables WHERE schemaname='public'")
            print(f"  Tables: {[t['tablename'] for t in tables]}")
            await conn.close()
            return
        except asyncio.TimeoutError:
            print(f"  TIMEOUT (10s)")
        except Exception as e:
            print(f"  FAILED: {type(e).__name__}: {e}")

asyncio.run(test())
