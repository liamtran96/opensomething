import Link from "next/link";
import { Media } from "@/components/media";
import { docsRoute, repoUrl } from "@/lib/shared";

const roadmapUrl = `${docsRoute}/project/roadmap`;
const runUrl = `${docsRoute}/getting-started/run-from-source`;
const downloadUrl = `${repoUrl}/releases/latest`;

const features = [
  {
    title: "Each bot has its own engine",
    media: "The engine choice in the bot settings",
    text: "A bot is a persona around an agent CLI or a chat API. You choose the model for each bot.",
  },
  {
    title: "Bots work with each other",
    media: "One bot gives a task to a second bot",
    text: "One bot gives work to a second bot and gets the result. The application records each hand-off.",
  },
  {
    title: "You approve what a bot does",
    media: "An approval request in the chat",
    text: "A permission request shows in the window. Your answer goes to the engine.",
  },
  {
    title: "Bots remember",
    media: "A bot recalls a fact in a new task",
    text: "A bot keeps facts in plain files and recalls them in a new task.",
  },
  {
    title: "Bots work on a schedule",
    media: "A routine starts a task",
    text: "A routine starts a task at a set time, with no message from you.",
  },
  {
    title: "Bots use your tools",
    media: "A bot calls a tool",
    text: "A bot calls the tools of the MCP servers that you add.",
  },
];

const jobs = ["Code review", "Bug reproduction", "Release notes", "Research", "Inbox triage", "Daily report"];

const questions = [
  {
    question: "What can I do with it now?",
    answer:
      "You can open the desktop window, change its background and send a line, which the application echoes. No bot feature is built yet.",
  },
  {
    question: "How is it different from a chat with one AI model?",
    answer:
      "The goal is a team. Each bot has its own engine, memory and tasks, and bots give work to other bots.",
  },
  {
    question: "Where does my data go?",
    answer:
      "The application runs on your computer and keeps its data in one folder there. We operate no service. A bot sends your messages to the engine that you choose for it.",
  },
  {
    question: "Which engines will it support?",
    answer: "The first driver is for chat APIs that are compatible with the OpenAI API. The second is for ACP agent CLIs.",
  },
  {
    question: "How much does it cost?",
    answer: "opensomething is free and open source, under the Apache License 2.0. You pay your engine provider.",
  },
];

const primaryButton = "rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground";
const secondaryButton = "rounded-lg border bg-fd-card px-4 py-2 text-sm font-medium";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6">
      <section className="flex flex-col items-center py-20 text-center md:py-28">
        <Link href={roadmapUrl} className="rounded-full border bg-fd-card px-3 py-1 text-sm text-fd-muted-foreground">
          The project is early. Read the roadmap
        </Link>
        <h1 className="mt-8 text-5xl font-semibold tracking-tight md:text-7xl">Meet opensomething</h1>
        <p className="mt-6 max-w-2xl text-lg text-fd-muted-foreground">
          A desktop application for a team of AI bots. The bots run on your computer, each one on the agent
          engine that you choose.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={downloadUrl} className={primaryButton}>
            Download
          </a>
          <Link href={runUrl} className={secondaryButton}>
            Run from source
          </Link>
          <a href={repoUrl} className={secondaryButton}>
            GitHub
          </a>
        </div>
        <div className="mt-14 w-full">
          <Media label="Video: the application in use" />
        </div>
      </section>

      <section className="border-t py-16">
        <h2 className="text-3xl font-semibold tracking-tight">A team, not one assistant</h2>
        <p className="mt-4 max-w-2xl text-fd-muted-foreground">
          You make a bot for each job and talk to it in a chat. The application owns the conversations, the
          hand-offs between bots, the approvals, the memory and the schedules. The engine only runs turns.
        </p>
        <div className="mt-8">
          <Media label="Image: the bot list and a chat" ratio="wide" />
        </div>
      </section>

      <section className="border-t py-16">
        <h2 className="text-3xl font-semibold tracking-tight">What a bot will do</h2>
        <p className="mt-4 max-w-2xl text-fd-muted-foreground">
          These are the goals of the design. None of them is built yet.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border bg-fd-card p-5">
              <Media label={feature.media} />
              <h3 className="mt-4 font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm text-fd-muted-foreground">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t py-16">
        <h2 className="text-3xl font-semibold tracking-tight">Give each bot a job</h2>
        <p className="mt-4 max-w-2xl text-fd-muted-foreground">
          A bot has a name, instructions and an engine. These are examples of jobs for a bot.
        </p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {jobs.map((job) => (
            <li key={job} className="rounded-full border bg-fd-card px-3 py-1 text-sm">
              {job}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t py-16">
        <h2 className="text-3xl font-semibold tracking-tight">Get opensomething</h2>
        <p className="mt-4 max-w-2xl text-fd-muted-foreground">
          The installers for Windows, macOS and Linux are on the releases page. You can also build the
          application from the source code.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={downloadUrl} className={primaryButton}>
            Download
          </a>
          <Link href={runUrl} className={secondaryButton}>
            Run from source
          </Link>
        </div>
      </section>

      <section className="border-t py-16">
        <h2 className="text-3xl font-semibold tracking-tight">Questions</h2>
        <div className="mt-6 divide-y rounded-xl border">
          {questions.map((item) => (
            <details key={item.question} className="group px-5 py-4">
              <summary className="cursor-pointer font-medium">{item.question}</summary>
              <p className="mt-3 text-sm text-fd-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center border-t py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Follow the work</h2>
        <p className="mt-4 text-fd-muted-foreground">The plan and each decision are in the open.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={docsRoute} className={primaryButton}>
            Read the documentation
          </Link>
          <Link href={roadmapUrl} className={secondaryButton}>
            Roadmap
          </Link>
        </div>
      </section>
    </main>
  );
}
