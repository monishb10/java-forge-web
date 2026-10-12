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

Lessons now open directly in a video classroom with a searchable course outline. The five-step theory interface, vocabulary cards, code walkthroughs, self-checks, and note editor have been removed from this page. One short “What you’ll learn” sentence explains the focus. Learners choose a video and explicitly tick “Mark lesson complete”; this saves the existing mastery flag and a dated study event to their own account. Unticking completion does not erase historical study activity.

The redesign uses charcoal surfaces, warm gold accents, Inter and Plus Jakarta Sans fonts, and a two-column coding workspace. The editor and results are independently resizable on desktop; mobile uses Problem and Code & results tabs. Practice and Playground still start with a learner's saved draft or a blank editor. No solution is inserted automatically.

GeeksforGeeks resources are external links in `lib/lesson-videos.json`, updated on 12 October 2026. Sixteen lessons include direct official YouTube URLs, with six published chapter starts. The player accepts only validated YouTube IDs and embeds from youtube-nocookie.com after the learner presses Play. An external watch link remains available if embedding is unavailable. Remaining resources open on GeeksforGeeks. There are video resources for 28 of the 29 lessons; file handling has a verified written guide because a suitable official video was not established. Several collection lessons use a clearly labelled overview.

Opening or playing a video never marks a lesson complete automatically. Completion means the learner checked the box; it is not a claim that video watch time was verified. YouTube metadata and chapter times were verified against primary sources, but third-party playback was not browser-tested in the development environment.

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

The Java example check requires a JDK. UI checks render all 29 video lessons in incomplete and completed states, validate safe video URLs and chapter starts, and check coding/tracker/account screens. They do not claim browser playback verification for third-party videos.
