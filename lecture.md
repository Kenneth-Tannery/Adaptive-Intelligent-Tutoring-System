# Kick-Off Event + Intro to Observability & Evaluation

Evaluations should have:
    - A target
    - A test set or tasks
    - A scoring method
    - A decision rule (what do we do with the result from scoring method?)

LLMs are hard to evaluate than traditional software: nondeterminism + subjectivity + drift
Capture the flow: input > context > prompts > tools > outputs > outcomes

Use free LLM API.

Should be a Minimum Viable Product application (login, databases, API). Can be web/mobile. 

Submission Requirements:
    - Video pitch including product video
    - Public codebase
    - Hosted site
    - Presentation (optional)


# Intro to Opik

Opik allows you to see the "trace", which shows each step taken by the agentic system taken to get to the final response. 
Opik's evaluation can be used on specific steps too. Example: see the websites visited when a browsing tool agent is used.

Looks like Opik can be used as a judge/scorer on certain things. In this example, Opik gave evaluation scores of how "tasty" an LLM-generated recipe is from 0-1.

Specific instances can be compiled into one dataset in Opik (maybe for Opik to learn what the outliers look like).

It is said that the most impactful way on integrating Opik is behind the scenes. 

An instance in Opik is called a trace/span.

Opik's evaluation tool can be used to test and see where the LLM's trace went wrong/have issues. 

Do 'opik configure' to connect it with your Opik account's API key.

Use the "@track" decorator to attach Opik to your LLM call, which is then sent to your Opik API. 