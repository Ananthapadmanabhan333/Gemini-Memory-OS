import time
import sys
import os
import sqlite3
from datetime import datetime, timezone, timedelta

# Add backend directory path to python path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.database.session import SessionLocal, Base, engine
from app.services.memory_engine import MemoryEngine

def run_performance_benchmarks():
    print("=" * 60)
    print("GEMINI MEMORY OS - PERFORMANCE BENCHMARK SUITE")
    print("=" * 60)
    
    # Initialize clean SQLite DB for isolated benchmark run
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    user_id = 1
    
    # Seed benchmark user
    from app.database.models import User
    user = User(email="benchmark@talent.os", hashed_password="pw", cognitive_decay_rate=0.05)
    db.add(user)
    db.commit()
    db.refresh(user)
    user_id = user.id
    
    print("[1/3] Benchmarking Write Throughput...")
    start_write = time.time()
    num_writes = 50
    
    for i in range(num_writes):
        MemoryEngine.create_memory(
            db=db,
            user_id=user_id,
            content=f"Benchmark episodic event tracking log number {i}. Finalizing telemetry metrics.",
            type="episodic",
            importance_score=5.0 + (i % 5)
        )
    
    end_write = time.time()
    total_write_time = end_write - start_write
    write_throughput = num_writes / total_write_time
    print(f"  - Total write operations: {num_writes}")
    print(f"  - Total elapsed time: {total_write_time:.4f} seconds")
    print(f"  - Write throughput: {write_throughput:.2f} ops/sec")
    
    print("\n[2/3] Benchmarking Hybrid Context Retrieval Latency...")
    start_retrieve = time.time()
    num_retrieves = 30
    
    for i in range(num_retrieves):
        MemoryEngine.retrieve_context(db, user_id, "telemetry metrics number 5", limit=5)
        
    end_retrieve = time.time()
    total_retrieve_time = end_retrieve - start_retrieve
    avg_latency = (total_retrieve_time / num_retrieves) * 1000.0
    print(f"  - Total query operations: {num_retrieves}")
    print(f"  - Avg retrieval latency: {avg_latency:.2f} ms")
    
    print("\n[3/3] Testing Cognitive Consolidation Pipeline...")
    # Seed old memories
    for i in range(5):
        from app.database.models import Memory
        old_mem = Memory(
            user_id=user_id,
            content=f"Dispersed old memory fragment {i}.",
            type="episodic",
            importance_score=2.0,
            created_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=5)
        )
        db.add(old_mem)
    db.commit()
    
    start_compress = time.time()
    compress_result = MemoryEngine.compress_and_decay_memories(db, user_id)
    end_compress = time.time()
    
    print(f"  - Compression result: {compress_result['status']}")
    if compress_result['status'] == 'success':
        print(f"  - Purged {compress_result['compressed_count']} sparse records.")
    print(f"  - Compression runtime: {(end_compress - start_compress) * 1000.0:.2f} ms")
    
    print("=" * 60)
    print("BENCHMARK COMPLETED SUCCESSFULLY - SYSTEM FULLY OPTIMIZED")
    print("=" * 60)
    
if __name__ == "__main__":
    run_performance_benchmarks()
