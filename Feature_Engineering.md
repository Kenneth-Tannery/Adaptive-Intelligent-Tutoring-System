# ASSISTments ITS Project: Feature Engineering Reference

## Overview
This document provides a comprehensive mapping of features from the ASSISTments 2020-2021 dataset for Intelligent Tutoring System development, organized by implementation phase and use case.

**Dataset Structure:** 10 relational tables (district_details, teacher_details, class_details, assignment_details, problem_details, student_details, teacher_logs, assignment_logs, problem_logs, student_logs)

---

## Phase 1: Core Features for BKT (Bayesian Knowledge Tracing)

### Raw Features (Available in Dataset)

| Feature | Table | Type | Description | Use in BKT |
|---------|-------|------|-------------|------------|
| **student_id** | student_details, problem_logs | int | Unique student identifier | Primary entity for tracking |
| **problem_id** | problem_details, problem_logs | int | Unique problem identifier | Maps to skills |
| **assignment_id** | assignment_logs, problem_logs | int | Assignment identifier | Can proxy as skill for skill_builders |
| **skills** | problem_details | list[str] | Common Core standards (e.g., "6.EE.A.1") | Primary skill tag |
| **correct** | problem_logs | binary (0/1) | First attempt correctness | BKT outcome variable |
| **start_time** | problem_logs, assignment_logs | timestamp | When problem/assignment started | Sequence ordering |
| **attempt_count** | problem_logs | int | Number of attempts on problem | Struggle indicator |
| **time_on_task** | problem_logs, assignment_logs | float | Time spent (seconds) | Efficiency metric |
| **assignment_type** | assignment_details | categorical | "problem_set" or "skill_builder" | Filter for skill-based learning |

### Engineered Features for BKT

| Feature | Formula/Logic | Purpose |
|---------|---------------|---------|
| **skill_id_numeric** | Map Common Core standards to integers | BKT requires numeric skill IDs |
| **skill_attempt_number** | `groupby(student_id, skill_id).cumcount() + 1` | Nth attempt at this skill |
| **prior_skill_mastery** | P(mastery) from BKT after N-1 attempts | BKT state tracking |
| **opportunities_to_learn** | Count of attempts per skill | Knowledge tracing parameter |

---

## Phase 2: Student Modeling Features

### 2.1 Learning Rate Indicators

| Feature | Source | Engineering Logic |
|---------|--------|-------------------|
| **learning_velocity** | problem_logs | `(current_accuracy - initial_accuracy) / num_attempts` |
| **improvement_rate** | problem_logs | `rolling_mean(correct, window=10).diff()` |
| **mastery_speed** | problem_logs | `time_to_reach_3_consecutive_correct` |
| **skill_transfer_rate** | problem_logs | `accuracy_on_new_skill_after_mastering_related` |

### 2.2 Help-Seeking Behavior

| Feature | Source | Engineering Logic |
|---------|--------|-------------------|
| **fraction_of_hints_used** | problem_logs | Already available in dataset |
| **answer_before_tutoring** | problem_logs | Already available in dataset |
| **tutoring_request_count** | student_logs | `count(action == 'tutoring_requested')` |
| **answer_requested_count** | student_logs | `count(action == 'answer_requested')` |
| **hint_abuse_score** | problem_logs | `(hints_used > 0.8) & (correct == 0)` |
| **productive_help_seeking** | problem_logs | `(0.2 < hints_used < 0.6) & (correct == 1)` |
| **help_seeking_timing** | student_logs | `timestamp(tutoring_requested) - timestamp(problem_started)` |

### 2.3 Time-on-Task Patterns

| Feature | Source | Engineering Logic |
|---------|--------|-------------------|
| **time_on_task** | problem_logs | Already available in dataset |
| **speed_accuracy_tradeoff** | problem_logs | `time_on_task / correct` (lower = better) |
| **persistence_score** | problem_logs | `time_on_task / attempt_count` |
| **session_duration** | assignment_logs | `max(timestamp) - min(timestamp)` per assignment |
| **time_between_attempts** | student_logs | `diff(timestamp)` for same problem |
| **time_since_last_session** | assignment_logs | Days since last assignment started |

### 2.4 Error Patterns

| Feature | Source | Engineering Logic |
|---------|--------|-------------------|
| **consecutive_errors** | problem_logs | `(correct == 0).rolling(3).sum()` |
| **error_after_hint** | problem_logs + student_logs | `(fraction_of_hints_used > 0) & (correct == 0)` |
| **wrong_response_count** | student_logs | `count(action == 'wrong_response')` |
| **guess_vs_slip_probability** | problem_logs | Infer from `(correct == 1 & hints_used > 0.5)` vs `(correct == 0 & time_on_task < avg)` |
| **misconception_clusters** | problem_logs | Group students by similar error patterns on skill |

### 2.5 Engagement Metrics

| Feature | Source | Engineering Logic |
|---------|--------|-------------------|
| **started_problem_sets_count** | student_details | Already available in dataset |
| **completed_problem_sets_count** | student_details | Already available in dataset |
| **mastered_skill_builders_count** | student_details | Already available in dataset |
| **dropout_risk** | student_details | `1 - (completed / started)` |
| **assignment_completion_rate** | assignment_logs | `completed_or_mastered / started` |
| **problem_completion_rate** | problem_logs | `count(problem_completed == True) / count(*)` |
| **session_consistency** | assignment_logs | `std(days_between_sessions)` |
| **wheel_spinning_indicator** | problem_logs | `(attempts > 10) & (mastery not achieved)` |

---

## Phase 3: Pedagogical Engine Features

### 3.1 Problem Difficulty Features

| Feature | Source | Engineering Logic |
|---------|--------|-------------------|
| **mean_correctness** | problem_details | Already available (population difficulty) |
| **student_answer_count** | problem_details | Already available (reliability metric) |
| **problem_difficulty** | problem_details | `1 - mean_correctness` |
| **personalized_difficulty** | problem_logs | `1 - student_accuracy_on_similar_problems` |
| **mean_time_on_task** | problem_details | Already available in dataset |
| **time_pressure_index** | problem_details | `std(time_on_task) / mean(time_on_task)` |

### 3.2 Skill Prerequisite Structure

| Feature | Source | Engineering Logic |
|---------|--------|-------------------|
| **skill_prerequisites** | problem_details + domain knowledge | Map Common Core standards hierarchy |
| **prerequisite_mastery** | problem_logs | `all(prerequisite_skills.mastery > 0.95)` |
| **skill_co_occurrence** | assignment_details | Problems often assigned together |
| **skill_sequence** | problem_logs | Order students typically master skills |

### 3.3 Zone of Proximal Development (ZPD)

| Feature | Source | Engineering Logic |
|---------|--------|-------------------|
| **student_ability_level** | problem_logs | `rolling_mean(correct, window=10)` |
| **zpd_lower_bound** | computed | `student_ability - 0.1` |
| **zpd_upper_bound** | computed | `student_ability + 0.3` |
| **problem_in_zpd** | problem_details + student | `zpd_lower < problem_difficulty < zpd_upper` |

### 3.4 Spaced Repetition Features

| Feature | Source | Engineering Logic |
|---------|--------|-------------------|
| **time_since_last_practice** | problem_logs | `current_time - last_attempt_time` per skill |
| **forgetting_probability** | computed | `exp(-time_since_last / decay_constant)` |
| **review_priority_score** | computed | `mastery_level * forgetting_probability` |
| **leitner_box_level** | problem_logs | Based on consecutive correct answers |

---

## Phase 4: Advanced Features

### 4.1 Tutoring System Features

| Feature | Source | Description |
|---------|--------|-------------|
| **tutoring_types** | problem_details | Available tutoring (Explanation, Hint, Scaffold) |
| **answer_given** | problem_logs | Whether bottom-out hint shown |
| **problem_type** | problem_details | Multiple choice, numeric, algebraic, etc. |
| **content_source** | problem_details | Where problem came from |

### 4.2 Teacher Interaction Features

| Feature | Source | Engineering Logic |
|---------|--------|-------------------|
| **teacher_engagement** | teacher_details | `assignment_reports_viewed_fraction` |
| **teacher_feedback_rate** | teacher_details | `graded_open_response_fraction` |
| **teacher_comment_rate** | teacher_details | `open_response_comment_fractionN` |
| **received_teacher_feedback** | teacher_logs | `count(action == 'open_response_graded')` per student |

### 4.3 Class/Peer Context

| Feature | Source | Engineering Logic |
|---------|--------|-------------------|
| **class_id** | student_details, class_details | Student's class |
| **class_size** | class_details | `student_count` |
| **class_avg_performance** | problem_logs | `mean(correct)` for class |
| **relative_to_class** | problem_logs | `student_accuracy - class_avg_accuracy` |
| **peer_comparison_percentile** | problem_logs | Student's rank in class |

### 4.4 Assignment Context

| Feature | Source | Description |
|---------|--------|-------------|
| **release_date** | assignment_details | When available |
| **due_date** | assignment_details | Deadline |
| **time_until_due** | assignment_details | `due_date - current_time` |
| **submitted_late** | assignment_logs | `start_time > due_date` |
| **problem_count** | assignment_details | Number of problems in assignment |

---

## Key Extraction Strategy

### 1. Skills Extraction from problem_details
```python
# The 'skills' column contains Common Core standards
# Example: "6.EE.A.1, 6.EE.A.2, 7.RP.A.1"

# Strategy:
1. Parse comma-separated skills
2. Map to numeric IDs
3. Handle multi-skill problems (explode or choose primary)
4. Build skill hierarchy from Common Core structure
```

### 2. Handling Multi-Skill Problems
**Options:**
- **Option A:** Explode rows (1 problem → N rows, 1 per skill)
- **Option B:** Use primary skill only (first in list)
- **Option C:** Use assignment_id for skill_builders (1 skill_builder = 1 skill)

**Recommendation:** Option C for skill_builders, Option A for problem_sets

### 3. Merging Strategy
```python
# Core data merge:
problem_logs 
  ← assignment_logs (on log_id) → get assignment_id, assignment_type
  ← problem_details (on problem_id) → get skills, difficulty
  ← student_details (on student_id) → get student aggregates
  ← student_logs (on log_id) → get action-level detail
```

---

## Feature Coverage by Table

### problem_logs (Primary)
- correct, attempt_count, time_on_task
- answer_before_tutoring, fraction_of_hints_used
- answer_given, problem_completed
- start_time, student_id, problem_id

### problem_details (Merge for skills)
- skills (Common Core standards)
- mean_correctness, mean_time_on_task
- problem_type, tutoring_types
- content_source

### assignment_logs (Merge for context)
- assignment_id, start_time
- mean_correct, time_on_task
- assignment_completed

### assignment_details (Merge for type)
- assignment_type (problem_set vs skill_builder)
- release_date, due_date
- problem_count

### student_details (Student aggregates)
- completed_problem_sets_count
- mastered_skill_builders_count
- mean_problem_correctness
- mean_problem_time_on_task

### student_logs (Action details)
- action types (tutoring_requested, answer_requested, etc.)
- timestamp (for timing analysis)

---

## Missing Features & Workarounds

### Not Available in Dataset
1. **Explicit skill prerequisites** - Use Common Core standards hierarchy
2. **Problem content text** - Cannot perform semantic analysis
3. **Student demographics** - Use class/district as proxy
4. **Step-by-step solving** - Only final answers available

### Limitations
1. **Skills may be missing** for some problems - Use assignment_id proxy
2. **Time estimates** may be imperfect - Multiple students on same device
3. **Hint content** not available - Only usage statistics

---

## Data Validation Requirements

### Essential Checks
- Load all 10 tables successfully
- Parse skills from problem_details
- Create numeric skill_id mapping
- Merge problem_logs + assignment_logs + problem_details
- Filter for skill_builder assignments (focused practice)
- Sort by (student_id, skill_id, start_time)
- Validate: no missing skills in critical records, correct temporal sequences
