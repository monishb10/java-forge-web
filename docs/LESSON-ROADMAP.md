# Java learning roadmap

The Lessons page follows the uploaded Java and DSA Practice Roadmap sheet. Its 18 stages contain 29 lessons; collections are split into individual Java APIs so learners can study one concept at a time.

1. Java basics and environment, including input/output
2. Variables and data types
3. Operators
4. Control flow
5. Loops
6. Functions and methods
7. Arrays
8. Strings and StringBuilder
9. Object-oriented programming
10. Exception handling
11. Collections: overview, ArrayList, LinkedList, HashMap, HashSet, Deque, Queue, PriorityQueue, Comparator, and Collections utilities
12. Generics
13. Recursion
14. File handling
15. Time and space complexity
16. Multithreading and concurrency
17. Java 8+ features
18. Final practice and review

Every lesson has five steps: Understand, See the example, Read the code, Watch a video, and Check understanding. The first step covers subtopics; the example uses an everyday situation with an interactive visual or a trace table. Learners explicitly choose to send example code to Playground. Practice editors still start blank unless the learner has saved a draft.

GeeksforGeeks resources are external links in `lib/lesson-videos.json`, checked on 11 October 2026. Videos are linked for 28 lessons. The file-handling lesson has a verified written GeeksforGeeks guide instead of an unverified video. Several collection lessons use a clearly labelled collections overview. Opening a video does not claim it was watched or complete a lesson; learners mark study and understanding themselves.

The sheet's terminology is corrected where necessary: Java passes arguments by value, arrays use the `length` field, and Java has no user-defined destructor. File examples operate on a temporary file in the execution environment, not a learner's computer. The thread example joins both workers before reading its synchronized counter.

`learningStages` and `learningTopicIds` in `lib/curriculum.ts` define the sequence and the server's allowed lesson IDs. `lib/lesson-roadmap.ts` combines existing examples with `lib/lesson-concepts.ts` and `lib/roadmap-extra-lessons.json`. Each lesson's progress, notes, and dated study event remain scoped to the authenticated account. Existing topic IDs remain stable.

Practice remains a separate bank of 20 topics, 32 programs per topic, and 64 supplied tests per program. This lesson update does not create programming exercises for the nine new lesson IDs or change accepted solution IDs and GitHub save behavior.

Validation:

```sh
pnpm test
pnpm typecheck
python scripts/check-lesson-java.py
pnpm build
```

The Java example check requires a JDK. UI checks render all 29 lessons across all five steps and inspect their resources; they do not claim browser playback verification for third-party videos.
