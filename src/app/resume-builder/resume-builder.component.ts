import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { GeminiService } from '../gemini.service';

// Import required libraries
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-resume-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './resume-builder.component.html',
  styleUrls: ['./resume-builder.component.css'], // Fixed plural typo
})
export class ResumeBuilderComponent {
  resumeForm: FormGroup;
  @ViewChild('result', { static: false }) resultContainer!: ElementRef;

  prompt: string = `
  Generate a professional, ATS-friendly resume in HTML format based on the provided JSON data. Adhere to the following updated guidelines:

  1. **Header Section:**
     - Use a **light gray background (#f8f9fa)** for the header for a subtle professional look.
     - Display the candidate's **full name** in bold, a larger font size (e.g., 24px), and center-align it for emphasis.
     - Arrange the **email address** and **phone number** on the left side, and the **LinkedIn, GitHub**, and **portfolio links** on the right side, all in smaller font (e.g., 12px).
     - Use a readable font style such as Arial or Roboto for the header details.

  2. **Professional Summary:**
     - Place this section directly below the header.
     - Style the summary in **italicized text** and use a slightly larger font (e.g., 14px) to make it visually appealing.
     - Center-align the summary with a clean padding for better readability.

  3. **Skills Section:**
     - Display skills as **chips** with a visually appealing, rounded border and a light background color (e.g., #e9ecef).
     - Ensure the chips are horizontally scrollable if they exceed the container's width, maintaining a modern design.
     - Use padding and spacing between chips to ensure a clean, uncluttered look.

  4. **Education Section:**
     - List the **degree**, **institution**, and **graduation year** in a structured, grid-like layout for clear alignment.
     - Bold the degree titles and institution names (e.g., B.Sc. in Computer Science at XYZ University).
     - Include light gray dividers between each education entry to separate multiple entries.

  5. **Work Experience Section:**
     - Use a well-spaced and consistent layout to display job details, including:
       - **Job Title** (bold, e.g., Software Developer)
       - **Company Name**
       - **Start and End Dates**
     - Avoid detailed descriptions; focus only on concise essentials.
     - Separate each experience entry with a subtle light gray divider.

  6. **Awards and Hobbies Sections:**
     - Use **bullet points** to list awards and hobbies for simplicity and clarity.
     - Use a consistent font size (e.g., 12px) and alignment for both sections.
     - Keep the formatting clean and aligned for ATS parsing.

  7. **Design and Styling:**
     - Employ a modern, minimalistic design with appropriate spacing for a clean layout.
     - Use **bold section headings** (font size: 14px) and **regular text** for content (font size: 12px).
     - Maintain consistent margins and padding between sections.
     - Add **light gray separators** (1px solid #dee2e6) between major sections for clear division.

  8. **Footer Section:**
     - Add a horizontal separator line before the footer section.
     - Include a simple note: **"References available upon request"** aligned to the left.
     - Use a slightly smaller font size (e.g., 10px) for the footer to differentiate it from the main content.

  Ensure the resume is:
  - **Clean and structured**, adhering to ATS compatibility guidelines.
  - **Optimized for readability** with balanced spacing and alignment.
  - Fully responsive and visually appealing across devices.

  Provide the final output in a well-formatted HTML structure with inline comments for key sections and styling elements.
`;

  


  geminiService: GeminiService = inject(GeminiService);

  constructor(private fb: FormBuilder) {
    this.resumeForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(30)]],
      lastName: ['', [Validators.required, Validators.maxLength(30)]],
      fullName: ['', [Validators.required, Validators.maxLength(60)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      linkedin: ['', Validators.pattern(/(https?:\/\/)?([\w]+\.)?linkedin\.com\/.*$/)],
      github: ['', Validators.pattern(/(https?:\/\/)?(www\.)?github\.com\/.*$/)],
      portfolio: ['', Validators.pattern(/https?:\/\/.+/)],
      address: ['', Validators.required],
      summary: ['', [Validators.required, Validators.maxLength(500)]],
      education: this.fb.group({
        degree: ['', Validators.required],
        institution: ['', Validators.required],
        year: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]],
      }),
      experience: this.fb.array([
        this.fb.group({
          jobTitle: ['', Validators.required],
          company: ['', Validators.required],
          startDate: ['', Validators.required],
          endDate: [''],
        }),
      ]),
      skills: ['', Validators.required],
      awards: [''],
      hobbies: [''],
    });
    
  }

  get experience(): FormArray {
    return this.resumeForm.get('experience') as FormArray;
  }

  addExperience() {
    this.experience.push(
      this.fb.group({
        jobTitle: ['', Validators.required],
        company: ['', Validators.required],
        startDate: ['', Validators.required],
        endDate: [''],
      })
    );
  }

  removeExperience(index: number) {
    this.experience.removeAt(index);
  }

  onSubmit() {
    if (this.resumeForm.valid) {
      console.log(this.resumeForm.value);
      alert('Resume submitted successfully!');
    } else {
      alert('Please fill out the form correctly.');
    }
  }

  submit() {
    this.resultContainer.nativeElement.innerHTML = '';
    const payload = this.resumeForm.value;
    const str = `${JSON.stringify(payload)}\n ${this.prompt} `;
    this.sendData(str);
  }

  async sendData(prompt: string) {
    if (prompt && this.resumeForm.value) {
      let data = await this.geminiService.generateText(prompt);
      console.log(data);
      data = data.replace('```html', '').replace('```', '');
      this.resultContainer.nativeElement.innerHTML = data;
    }
  }

  printDownload() {
    html2canvas(this.resultContainer.nativeElement)
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png'); // Generate image data from the canvas

        const pdf = new jsPDF('p', 'mm', 'a4'); // Initialize jsPDF with A4 page dimensions
        const pageWidth = pdf.internal.pageSize.getWidth(); // Get the PDF page width
        const pageHeight = pdf.internal.pageSize.getHeight(); // Get the PDF page height

        const imgWidth = pageWidth; // Fit image to page width
        const imgHeight = (canvas.height * imgWidth) / canvas.width; // Maintain the image aspect ratio

        let position = 0; // Y-coordinate to start rendering content
        let heightLeft = imgHeight; // Remaining height of the content to render

        // Render the first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Render additional pages if content overflows
        while (heightLeft > 0) {
          position -= pageHeight; // Update the position for the next page
          pdf.addPage(); // Add a new page
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight); // Add image content
          heightLeft -= pageHeight; // Adjust the remaining height
        }

        pdf.save('Download.pdf'); // Save the PDF file with the name "Download.pdf"
      })
      .catch((error) => {
        console.error('Error generating PDF:', error);
        alert('An error occurred while generating the PDF. Please try again.');
      });
  }
}
