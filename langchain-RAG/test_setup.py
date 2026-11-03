from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from dotenv import load_dotenv
import os

load_dotenv()

print("Loading embeddings...")

embeddings = OpenAIEmbeddings(
    openai_api_key=os.getenv("OPENROUTER_API_KEY"),
    openai_api_base="https://openrouter.ai/api/v1"
)

print("Connecting to Pinecone...")

vectorstore = PineconeVectorStore(
    index_name=os.environ["INDEX_NAME"],
    embedding=embeddings
)

retriever = vectorstore.as_retriever()

print("Testing retrieval...")

docs = retriever.invoke("AI")
print(f"Found {len(docs)} documents")

print("✅ Retriever working")