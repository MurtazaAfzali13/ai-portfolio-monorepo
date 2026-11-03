import os
from dotenv import load_dotenv
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore

load_dotenv()

if __name__ == '__main__':
    print("Ingesting...")
    
    # اصلاح مسیر فایل به مسیر نسبی
    loader = TextLoader(
        "mediumblog1.txt",
        encoding='utf-8'
    )
    documents = loader.load()
    
    print("Splitting...")
    text_splitter = CharacterTextSplitter(
        separator="=========================================", # جداسازی بر اساس بخش‌های پورتفولیو
        chunk_size=1000,
        chunk_overlap=150
    )
    texts = text_splitter.split_documents(documents)
    print(f"Created {len(texts)} chunks")
    
    embeddings = OpenAIEmbeddings(
        openai_api_key=os.getenv("OPENROUTER_API_KEY"),
        openai_api_base="https://openrouter.ai/api/v1"
    )
    
    print("Ingesting to Pinecone...")
    PineconeVectorStore.from_documents(
        texts,
        embeddings,
        index_name=os.environ['INDEX_NAME'],
        pinecone_api_key=os.environ['PINECONE_API_KEY']
    )
    
    print("Done ✅")