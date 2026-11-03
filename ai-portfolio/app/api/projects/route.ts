import { supabase } from '@/lib/supabase/client';
import { enrichProjectDescription } from '@/lib/project-copy';

interface ProjectRow {
  id: string;
  title: string;
  description: string;
  tech: string[];
  image: string;
  live_url: string;
  github_url: string;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
  desc: string;
  tech: string[];
  image: string;
  liveUrl: string;
  githubUrl: string;
  createdAt: string;
}

export async function GET(): Promise<Response> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // تبدیل snake_case به camelCase برای React
    const projects: Project[] = data.map((row: ProjectRow) => ({
      id: row.id,
      title: row.title,
      desc: enrichProjectDescription(row.title, row.description),
      tech: row.tech || [],   // JSONB در Supabase خودش آرایه است
      image: row.image,
      liveUrl: row.live_url,  // تبدیل live_url به liveUrl
      githubUrl: row.github_url, // تبدیل github_url به githubUrl
      createdAt: row.created_at
    }));

    return new Response(JSON.stringify(projects), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}