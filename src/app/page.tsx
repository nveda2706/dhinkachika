'use client';
import { useState, useRef } from 'react';
import html2canvasPro from 'html2canvas-pro'; // <-- Native top-level import
import { jsPDF } from 'jspdf';                 // <-- Native top-level import


export default function Home() {
  const resumeRef = useRef<HTMLDivElement>(null);
  const [targetRole, setTargetRole] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!targetRole || !rawInput) return alert('Please fill in all fields');
    setLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole, rawInput }),
      });
      const data = await response.json();
      if (data.bullets) {
        setBullets(data.bullets);
      } else if (data.error) {
        alert('AI Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to communicate with the server.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const element = resumeRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvasPro(element, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff', 
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; 
      const pageHeight = 295; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('my-ai-resume.pdf');
    } catch (err) {
      console.error('PDF Generation Crash Logic:', err);
      alert('Failed to generate standard PDF.');
    }
  };




  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <header className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-extrabold text-teal-400">✨ Project-to-Resume AI Architect</h1>
        <p className="text-slate-400 text-sm mt-1">Transform student assignments and GitHub mess into ATS-crushing bullet points.</p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: Input Form */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-300">Target Internship / Job Title</label>
            <input 
              type="text" 
              placeholder="e.g., Frontend Web Developer Intern" 
              className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 focus:outline-none focus:border-teal-400 text-sm"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-300">Paste Project Code, Readme, or Assignment Details</label>
            <textarea 
              rows={8}
              placeholder="Example: I built a basic weather app using React. It fetches data from an api. I used useState hooks and styled it with Tailwind CSS. It works on mobile too." 
              className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 focus:outline-none focus:border-teal-400 text-sm"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
            />
          </div>
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-600 transition text-slate-950 font-bold p-3 rounded-lg disabled:opacity-50 text-sm cursor-pointer"
          >
            {loading ? 'Analyzing Project via AI...' : 'Generate Resume Bullets 🚀'}
          </button>
        </div>

        {/* Right Side: Virtual Live Resume Paper Preview */}
        <div ref={resumeRef} className="bg-white text-slate-900 p-8 rounded-xl shadow-2xl min-h-[400px] border border-slate-200 flex flex-col justify-between" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>
          <div>
            <h3 className="text-xl font-bold border-b-2 border-slate-800 pb-1 mb-4 text-center uppercase tracking-wide">Projects</h3>
            {bullets.length === 0 ? (
              <p className="text-slate-400 text-sm italic text-center mt-12">Your polished professional bullet points will render here layout-perfect...</p>
            ) : (
              <ul className="list-disc pl-5 space-y-3">
                {bullets.map((bullet, i) => (
                  <li key={i} className="text-sm font-normal leading-relaxed text-slate-800">{bullet}</li>
                ))}
              </ul>
            )}
          </div>
          {bullets.length > 0 && (
            <button onClick={downloadPDF} className="mt-6 self-end border-2 border-slate-800 hover:bg-slate-800 hover:text-white transition text-slate-800 font-bold px-4 py-2 rounded text-xs cursor-pointer">
              📄 Export PDF Standard format
            </button>
          )}
        </div>
        
      </div>
    </main>
  );

}
