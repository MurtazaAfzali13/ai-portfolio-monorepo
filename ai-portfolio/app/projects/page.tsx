// app/projects/page.jsx
"use client";

import SpaceBackground from "@/components/SpaceBackground";
import ProjectsList from "@/components/ProjectList";

export default function ProjectsPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center relative overflow-hidden pt-20">
      {/* استفاده از کامپوننت SpaceBackground */}
      <SpaceBackground />
      
      {/* استفاده از کامپوننت ProjectsList */}
      <ProjectsList />
    </div>
  );
}