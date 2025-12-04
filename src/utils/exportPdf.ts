import html2pdf from 'html2pdf.js';

interface TaskForPdf {
  task: string;
  description?: string;
  dueDate?: string;
  isCompleted: boolean;
  isCustom?: boolean;
}

interface PhaseForPdf {
  phase: string;
  tasks: TaskForPdf[];
}

interface PdfExportOptions {
  title: string;
  organizationName: string;
  campaignName?: string;
  phases: PhaseForPdf[];
  totalProgress: number;
}

export async function exportProjectManagerToPdf(options: PdfExportOptions): Promise<void> {
  const { title, organizationName, campaignName, phases, totalProgress } = options;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px;">
        <h1 style="color: #1f2937; margin: 0 0 10px 0; font-size: 24px;">${title}</h1>
        <p style="color: #6b7280; margin: 0; font-size: 14px;">${organizationName}${campaignName ? ` - ${campaignName}` : ''}</p>
        <div style="margin-top: 15px; background: #f3f4f6; border-radius: 8px; padding: 10px;">
          <span style="font-weight: bold; color: #4f46e5;">${Math.round(totalProgress)}% Complete</span>
        </div>
      </div>

      ${phases.map(phase => `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
          <h2 style="color: #374151; font-size: 18px; margin: 0 0 15px 0; padding: 10px; background: #f9fafb; border-left: 4px solid #4f46e5; border-radius: 4px;">
            ${phase.phase}
          </h2>
          <div style="padding-left: 10px;">
            ${phase.tasks.map(task => `
              <div style="display: flex; align-items: flex-start; margin-bottom: 12px; padding: 10px; background: ${task.isCompleted ? '#ecfdf5' : '#ffffff'}; border: 1px solid ${task.isCompleted ? '#a7f3d0' : '#e5e7eb'}; border-radius: 6px;">
                <div style="width: 20px; height: 20px; border: 2px solid ${task.isCompleted ? '#10b981' : '#d1d5db'}; border-radius: 4px; margin-right: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: ${task.isCompleted ? '#10b981' : 'white'};">
                  ${task.isCompleted ? '<span style="color: white; font-size: 12px;">✓</span>' : ''}
                </div>
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span style="font-weight: 500; color: ${task.isCompleted ? '#6b7280' : '#1f2937'}; ${task.isCompleted ? 'text-decoration: line-through;' : ''}">${task.task}</span>
                    ${task.isCustom ? '<span style="font-size: 10px; padding: 2px 6px; background: #e0e7ff; color: #4f46e5; border-radius: 4px;">Custom</span>' : ''}
                    ${task.dueDate ? `<span style="font-size: 12px; color: #6b7280;">📅 ${task.dueDate}</span>` : ''}
                  </div>
                  ${task.description ? `<p style="margin: 5px 0 0 0; font-size: 13px; color: #6b7280;">${task.description}</p>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
        Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  `;

  const element = document.createElement('div');
  element.innerHTML = html;
  document.body.appendChild(element);

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `${title.replace(/\s+/g, '-').toLowerCase()}-checklist.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } finally {
    document.body.removeChild(element);
  }
}
