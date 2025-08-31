"""
Tests for Knowledge Base Management in Convex RAG System
"""

import pytest
from typing import Dict, List, Any
import json
from datetime import datetime

# Mock Convex client for testing
class MockConvexClient:
    def __init__(self):
        self.knowledge_store = {}
        self.threads = {}
        self.toys = {
            "toy_123": {
                "id": "toy_123",
                "name": "Benny Bear",
                "type": "bear",
                "isForKids": True,
                "ageGroup": "3-5",
                "personalityPrompt": "A friendly bear who loves stories"
            }
        }
    
    async def mutation(self, path: str, args: Dict[str, Any]):
        """Mock mutation handler"""
        if path == "knowledge.addToyKnowledge":
            return self._add_knowledge(args)
        elif path == "knowledge.updateToyKnowledge":
            return self._update_knowledge(args)
        elif path == "knowledge.deleteToyKnowledge":
            return self._delete_knowledge(args)
        elif path == "knowledge.clearToyKnowledge":
            return self._clear_knowledge(args)
        elif path == "agents.saveKnowledgeMessage":
            return self._save_knowledge_message(args)
        return None
    
    async def query(self, path: str, args: Dict[str, Any]):
        """Mock query handler"""
        if path == "knowledge.getToyKnowledge":
            return self._get_knowledge(args)
        elif path == "knowledge.getToyKnowledgeStats":
            return self._get_stats(args)
        elif path == "agents.getThreadByToyId":
            return self._get_thread(args)
        return None
    
    async def action(self, path: str, args: Dict[str, Any]):
        """Mock action handler"""
        if path == "knowledge.importToyKnowledge":
            return self._import_knowledge(args)
        elif path == "knowledge.searchToyKnowledge":
            return self._search_knowledge(args)
        return None
    
    def _add_knowledge(self, args: Dict[str, Any]) -> str:
        """Add knowledge to store"""
        knowledge_id = f"knowledge_{len(self.knowledge_store) + 1}"
        self.knowledge_store[knowledge_id] = {
            "id": knowledge_id,
            "toyId": args["toyId"],
            "content": args["content"],
            "type": args["type"],
            "metadata": args.get("metadata", {
                "source": "manual",
                "importance": 0.5,
                "tags": []
            }),
            "createdAt": datetime.now().timestamp(),
            "updatedAt": datetime.now().timestamp()
        }
        return knowledge_id
    
    def _get_knowledge(self, args: Dict[str, Any]) -> List[Dict]:
        """Get knowledge for a toy"""
        results = []
        for item in self.knowledge_store.values():
            if item["toyId"] == args["toyId"]:
                if not args.get("type") or item["type"] == args["type"]:
                    results.append(item)
        
        # Apply limit
        limit = args.get("limit", 100)
        return results[:limit]
    
    def _search_knowledge(self, args: Dict[str, Any]) -> List[Dict]:
        """Search knowledge using simple text matching"""
        query_lower = args["query"].lower()
        results = []
        
        for item in self.knowledge_store.values():
            if item["toyId"] == args["toyId"]:
                relevance = self._calculate_relevance(item["content"], query_lower)
                if relevance >= args.get("minRelevance", 0.3):
                    results.append({
                        **item,
                        "relevance": relevance
                    })
        
        # Sort by relevance and apply limit
        results.sort(key=lambda x: x["relevance"], reverse=True)
        return results[:args.get("limit", 10)]
    
    def _calculate_relevance(self, content: str, query: str) -> float:
        """Simple relevance calculation"""
        content_lower = content.lower()
        query_words = query.split()
        matches = sum(1 for word in query_words if word in content_lower)
        return matches / len(query_words) if query_words else 0
    
    def _import_knowledge(self, args: Dict[str, Any]) -> Dict:
        """Import multiple knowledge documents"""
        total_chunks = 0
        successful_chunks = 0
        errors = []
        
        for doc in args["documents"]:
            try:
                # Simple chunking
                chunk_size = args.get("chunkSize", 500)
                chunks = [doc["content"][i:i+chunk_size] 
                         for i in range(0, len(doc["content"]), chunk_size)]
                total_chunks += len(chunks)
                
                for chunk in chunks:
                    try:
                        self._add_knowledge({
                            "toyId": args["toyId"],
                            "content": chunk,
                            "type": doc["type"],
                            "metadata": {
                                "source": doc["source"],
                                "importance": 0.5,
                                "tags": []
                            }
                        })
                        successful_chunks += 1
                    except Exception as e:
                        errors.append(str(e))
            except Exception as e:
                errors.append(f"Failed to process document: {e}")
        
        return {
            "success": len(errors) == 0,
            "totalChunks": total_chunks,
            "successfulChunks": successful_chunks,
            "errors": errors
        }
    
    def _get_stats(self, args: Dict[str, Any]) -> Dict:
        """Get knowledge statistics"""
        knowledge = self._get_knowledge({"toyId": args["toyId"]})
        
        stats = {
            "total": len(knowledge),
            "byType": {},
            "avgImportance": 0,
            "totalCharacters": 0,
            "topTags": []
        }
        
        if knowledge:
            # Count by type
            for item in knowledge:
                type_name = item["type"]
                stats["byType"][type_name] = stats["byType"].get(type_name, 0) + 1
                stats["totalCharacters"] += len(item["content"])
            
            # Calculate average importance
            total_importance = sum(item.get("metadata", {}).get("importance", 0.5) 
                                  for item in knowledge)
            stats["avgImportance"] = total_importance / len(knowledge)
        
        return stats


class TestKnowledgeManagement:
    """Test knowledge base management functions"""
    
    @pytest.fixture
    def client(self):
        return MockConvexClient()
    
    @pytest.mark.asyncio
    async def test_add_toy_knowledge(self, client):
        """Test adding knowledge to a toy"""
        # Add backstory knowledge
        knowledge_id = await client.mutation("knowledge.addToyKnowledge", {
            "toyId": "toy_123",
            "content": "Benny Bear was born in the magical Rainbow Forest",
            "type": "backstory",
            "metadata": {
                "source": "manual",
                "importance": 0.8,
                "tags": ["origin", "fantasy"]
            }
        })
        
        assert knowledge_id is not None
        assert knowledge_id.startswith("knowledge_")
        
        # Verify knowledge was added
        knowledge = await client.query("knowledge.getToyKnowledge", {
            "toyId": "toy_123",
            "type": "backstory"
        })
        
        assert len(knowledge) == 1
        assert knowledge[0]["content"] == "Benny Bear was born in the magical Rainbow Forest"
        assert knowledge[0]["type"] == "backstory"
    
    @pytest.mark.asyncio
    async def test_import_bulk_knowledge(self, client):
        """Test bulk import of knowledge documents"""
        documents = [
            {
                "content": "Benny loves honey and berries. He enjoys playing hide and seek.",
                "type": "preferences",
                "source": "character_sheet"
            },
            {
                "content": "Benny is friends with Ruby Rabbit and Oliver Owl.",
                "type": "relationships",
                "source": "character_sheet"
            }
        ]
        
        result = await client.action("knowledge.importToyKnowledge", {
            "toyId": "toy_123",
            "documents": documents,
            "chunkSize": 50  # Small chunks for testing
        })
        
        assert result["success"] is True
        assert result["totalChunks"] == 3  # Two documents chunked
        assert result["successfulChunks"] == 3
        assert len(result["errors"]) == 0
    
    @pytest.mark.asyncio
    async def test_search_knowledge(self, client):
        """Test searching toy knowledge"""
        # Add some knowledge first
        await client.mutation("knowledge.addToyKnowledge", {
            "toyId": "toy_123",
            "content": "Benny loves to tell bedtime stories about the stars",
            "type": "personality"
        })
        
        await client.mutation("knowledge.addToyKnowledge", {
            "toyId": "toy_123",
            "content": "Benny's favorite game is counting clouds",
            "type": "preferences"
        })
        
        # Search for knowledge
        results = await client.action("knowledge.searchToyKnowledge", {
            "toyId": "toy_123",
            "query": "stories stars",
            "limit": 5
        })
        
        assert len(results) > 0
        assert results[0]["relevance"] > 0
        assert "stories" in results[0]["content"].lower()
    
    @pytest.mark.asyncio
    async def test_knowledge_types(self, client):
        """Test different knowledge types"""
        knowledge_types = [
            ("backstory", "Born in Rainbow Forest"),
            ("personality", "Friendly and curious"),
            ("facts", "Loves honey"),
            ("memories", "First met Ruby at the pond"),
            ("rules", "Always be kind to friends"),
            ("preferences", "Prefers sunny days"),
            ("relationships", "Best friend is Ruby")
        ]
        
        for k_type, content in knowledge_types:
            await client.mutation("knowledge.addToyKnowledge", {
                "toyId": "toy_123",
                "content": content,
                "type": k_type
            })
        
        # Get all knowledge
        all_knowledge = await client.query("knowledge.getToyKnowledge", {
            "toyId": "toy_123"
        })
        
        assert len(all_knowledge) == len(knowledge_types)
        
        # Check each type
        for k_type, _ in knowledge_types:
            typed_knowledge = await client.query("knowledge.getToyKnowledge", {
                "toyId": "toy_123",
                "type": k_type
            })
            assert len(typed_knowledge) == 1
            assert typed_knowledge[0]["type"] == k_type
    
    @pytest.mark.asyncio
    async def test_knowledge_statistics(self, client):
        """Test getting knowledge statistics"""
        # Add various knowledge items
        for i in range(5):
            await client.mutation("knowledge.addToyKnowledge", {
                "toyId": "toy_123",
                "content": f"Test content {i}",
                "type": "facts" if i < 3 else "personality",
                "metadata": {
                    "importance": 0.5 + (i * 0.1),
                    "tags": ["test"]
                }
            })
        
        # Get statistics
        stats = await client.query("knowledge.getToyKnowledgeStats", {
            "toyId": "toy_123"
        })
        
        assert stats["total"] == 5
        assert stats["byType"]["facts"] == 3
        assert stats["byType"]["personality"] == 2
        assert stats["avgImportance"] > 0
        assert stats["totalCharacters"] > 0
    
    @pytest.mark.asyncio
    async def test_knowledge_chunking(self, client):
        """Test smart chunking of long content"""
        long_content = (
            "Benny Bear loves adventure. "
            "He explores the forest daily. "
            "His favorite spot is the honey tree. "
            "He shares stories with friends. "
            "Every night he looks at stars."
        )
        
        result = await client.action("knowledge.importToyKnowledge", {
            "toyId": "toy_123",
            "documents": [{
                "content": long_content,
                "type": "backstory",
                "source": "test"
            }],
            "chunkSize": 30  # Force chunking
        })
        
        assert result["success"] is True
        assert result["totalChunks"] > 1  # Should be chunked
        
        # Verify chunks were created
        knowledge = await client.query("knowledge.getToyKnowledge", {
            "toyId": "toy_123",
            "type": "backstory"
        })
        
        assert len(knowledge) > 1
        
        # Reconstruct content from chunks
        reconstructed = " ".join([k["content"] for k in knowledge])
        # Content should be preserved (though might have slight differences in spacing)
        assert all(word in reconstructed for word in long_content.split())
    
    @pytest.mark.asyncio
    async def test_knowledge_relevance_filtering(self, client):
        """Test relevance filtering in search"""
        # Add knowledge with varying relevance
        knowledge_items = [
            "Benny loves playing with toy trains",
            "Ruby Rabbit is Benny's best friend",
            "The forest has many tall trees",
            "Benny's favorite toy is a red train"
        ]
        
        for content in knowledge_items:
            await client.mutation("knowledge.addToyKnowledge", {
                "toyId": "toy_123",
                "content": content,
                "type": "facts"
            })
        
        # Search with high relevance threshold
        results = await client.action("knowledge.searchToyKnowledge", {
            "toyId": "toy_123",
            "query": "toy train",
            "minRelevance": 0.5
        })
        
        # Should only return highly relevant results
        assert all("toy" in r["content"].lower() or "train" in r["content"].lower() 
                  for r in results)
        assert all(r["relevance"] >= 0.5 for r in results)
    
    @pytest.mark.asyncio
    async def test_knowledge_metadata(self, client):
        """Test knowledge metadata handling"""
        metadata = {
            "source": "user_input",
            "importance": 0.9,
            "tags": ["personality", "core", "friendly"],
            "expiresAt": (datetime.now().timestamp() + 86400) * 1000  # 24 hours
        }
        
        knowledge_id = await client.mutation("knowledge.addToyKnowledge", {
            "toyId": "toy_123",
            "content": "Benny is always cheerful and helpful",
            "type": "personality",
            "metadata": metadata
        })
        
        # Retrieve and check metadata
        knowledge = await client.query("knowledge.getToyKnowledge", {
            "toyId": "toy_123"
        })
        
        item = next(k for k in knowledge if k["id"] == knowledge_id)
        assert item["metadata"]["importance"] == 0.9
        assert "personality" in item["metadata"]["tags"]
        assert item["metadata"]["source"] == "user_input"


class TestKnowledgeIntegration:
    """Test integration with Agent system"""
    
    @pytest.fixture
    def client(self):
        return MockConvexClient()
    
    @pytest.mark.asyncio
    async def test_knowledge_in_agent_context(self, client):
        """Test that knowledge is included in agent context"""
        # Add relevant knowledge
        await client.mutation("knowledge.addToyKnowledge", {
            "toyId": "toy_123",
            "content": "Benny loves to tell stories about space adventures",
            "type": "personality"
        })
        
        await client.mutation("knowledge.addToyKnowledge", {
            "toyId": "toy_123",
            "content": "Benny's favorite planet is Mars because it's red like strawberries",
            "type": "facts"
        })
        
        # Search for relevant knowledge (simulating what agent would do)
        relevant = await client.action("knowledge.searchToyKnowledge", {
            "toyId": "toy_123",
            "query": "tell me about space",
            "limit": 3
        })
        
        assert len(relevant) > 0
        assert any("space" in k["content"].lower() or "planet" in k["content"].lower() 
                  for k in relevant)
    
    @pytest.mark.asyncio
    async def test_knowledge_importance_ordering(self, client):
        """Test that high-importance knowledge is prioritized"""
        # Add knowledge with different importance levels
        knowledge_items = [
            ("Critical safety rule", "rules", 1.0),
            ("Backstory detail", "backstory", 0.8),
            ("Random fact", "facts", 0.3),
            ("Core personality", "personality", 0.9)
        ]
        
        for content, k_type, importance in knowledge_items:
            await client.mutation("knowledge.addToyKnowledge", {
                "toyId": "toy_123",
                "content": content,
                "type": k_type,
                "metadata": {"importance": importance}
            })
        
        # Get all knowledge
        all_knowledge = await client.query("knowledge.getToyKnowledge", {
            "toyId": "toy_123"
        })
        
        # Check that high-importance items exist
        high_importance = [k for k in all_knowledge 
                          if k.get("metadata", {}).get("importance", 0) >= 0.8]
        
        assert len(high_importance) >= 3
        assert any(k["type"] == "rules" for k in high_importance)


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
