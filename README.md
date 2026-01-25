Adaptive Intelligent Tutoring System

## Database & Data Source
We utilize the **ASSISTments 2012-2013 Dataset**, a comprehensive collection of student-tutor interactions. 
* **Source:** [Open Science Framework (OSF) - 7cgav](https://osf.io/7cgav/overview)
* **Processing:** We cleaned over 24GB of raw student logs to extract engagement telemetry and skill-specific performance metrics.

## Core Technical Approaches

### 1. Dynamic Question Generation (ZPD-Targeted)
The core of our API is a generative engine that creates math problems tailored to a student's current proficiency. Instead of a static bank of questions, our system sends the student's current **Bayesian Knowledge Tracing (BKT)** mastery score and the specific skill name to an LLM. 

* **The Logic:** The API instructs the model to generate a question at a specific difficulty level. 
* **The Result:** If a student is in the **Challenge Zone**, the API requests a problem with higher complexity. Conversely, if the student is struggling, the API prompts the model to generate a foundational problem to rebuild confidence and fill knowledge gaps.

### 2. Context-Aware Hint Logic (Tiered Scaffolding)
Our API manages a sophisticated tiered hint system that goes beyond simple text responses. By evaluating the `attempt_count` and `fraction_of_hints_used`, the API directs the AI to generate a hint that matches the student's immediate cognitive need:
* **Attempt 1:** A subtle conceptual nudge to trigger recall.
* **Attempt 2:** A strategic breakdown or procedural step.
* **Attempt 3:** A full "bottom-out" explanation providing the solution.
This ensures the AI provides the **Minimum Necessary Support** to encourage independent problem-solving and reduce "Hint Abuse."

### 3. Real-Time Pedagogical Interventions
The API serves as a monitoring station that constantly calculates **Learning Velocity**. By comparing current performance against historical data in the cleaned ASSISTments dataset, the AI can detect a **"Wheel-Spinning"** state—where a student is putting in effort but not making progress. 
* **Proactive Action:** The API triggers an intervention where the AI buddy interrupts the loop to offer a different approach, such as a visual analogy or a simplified sub-problem, ensuring the student never stays stuck for too long.
