/**
 * 🤘 Welcome to Stagehand!
 *
 * TO RUN THIS PROJECT:
 * ```
 * npm install
 * npm run start
 * ```
 *
 * In this quickstart, we'll be automating a parking ticket payment process using Playwright and Stagehand's AI features.
 *
 * 1. Navigate to the SF Municipal Transportation Agency payment portal
 * 2. Enter license plate information
 * 3. Select tickets to pay
 * 4. Fill out payment information using Stagehand's AI-powered form filling
 */

import StagehandConfig from "./stagehand.config.js";
import { Stagehand } from "@browserbasehq/stagehand";
import chalk from "chalk";
import boxen from "boxen";
import dotenv from "dotenv";

dotenv.config();

function announce(message: string, title?: string) {
  console.log(
    boxen(message, {
      padding: 1,
      margin: 3,
      title: title || "Stagehand",
    })
  );
}

async function main() {
  console.log(
    [
      `🤘 ${chalk.yellow("Welcome to Stagehand!")}`,
      "",
      "Stagehand is a tool that allows you to automate browser interactions.",
      "In this quickstart, we'll be automating a parking ticket payment on the San Francisco Municipal Transportation Agency website.",
      "",
      `1. Navigate to ${chalk.blue(
        "https://wmq.etimspayments.com/pbw/include/sanfrancisco/input.jsp"
      )}`,
      `2. Use ${chalk.green("act")} to enter the license plate information`,
      `3. Select all tickets and submit the form`,
      `4. Fill out the payment information using ${chalk.green(
        "act"
      )} with variables`,
      "",
      `${chalk.bold(chalk.green("PRESS ENTER TO CONTINUE..."))}`,
    ].join("\n")
  );

  await new Promise((resolve) => {
    process.stdin.once("data", () => {
      resolve(undefined);
    });
  });
  const stagehand = new Stagehand({
    ...StagehandConfig,
  });
  await stagehand.init();
  const page = stagehand.page;

  if (StagehandConfig.env === "BROWSERBASE") {
    console.log(
      boxen(
        `View this session live in your browser: \n${chalk.blue(
          `https://browserbase.com/sessions/${stagehand.browserbaseSessionID}`
        )}`,
        {
          title: "Browserbase",
          padding: 1,
        }
      )
    );
  }

  await stagehand.page.goto(
    "https://wmq.etimspayments.com/pbw/include/sanfrancisco/input.jsp"
  );

  await page.act({
    action: "Enter the plate number 8XWY857 and then search for citations.",
  });

  await page.act({
    action:
      "Select the 'I would like to pay for all tickets' radio button. Then click the 'Submit' button.",
  });

  await page.act({
    action:
      "Enter the following information:\n" +
      "Name on the card: %nameOnCard%\n" +
      "Address: %address%\n" +
      "City: %city%\n" +
      "State: %state%\n" +
      "Zip code: %zip%" +
      "Card number: %cardNumber%\n" +
      "Expiration date month: %expirationDateMonth%\n" +
      "Expiration date year: %expirationDateYear%\n" +
      "CVV: %cvv%\n",
    variables: {
      cardNumber: "4111111111111111",
      expirationDateMonth: "05 - May",
      expirationDateYear: "2025",
      cvv: "123",
      nameOnCard: "John Doe",
      address: "123 Main St",
      city: "San Francisco",
      state: "CA",
      zip: "94101",
    },
  });

  await page.act({
    action: "Click the 'Submit' button.",
  });

  await stagehand.close();

  if (StagehandConfig.env === "BROWSERBASE") {
    console.log(
      "Session completed. Waiting for 10 seconds to see the logs and recording..."
    );
    //   Wait for 10 seconds to see the logs
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log(
      boxen(
        `View this session recording in your browser: \n${chalk.blue(
          `https://browserbase.com/sessions/${stagehand.browserbaseSessionID}`
        )}`,
        {
          title: "Browserbase",
          padding: 1,
          margin: 3,
        }
      )
    );
  } else {
    console.log(
      "We hope you enjoyed using Stagehand locally! On Browserbase, you can bypass captchas, replay sessions, and access unparalleled debugging tools!\n10 free sessions: https://www.browserbase.com/sign-up\n\n"
    );
  }

  console.log(
    `🤘 Thanks for using Stagehand! Create an issue if you have any feedback: ${chalk.blue(
      "https://github.com/browserbase/stagehand/issues/new"
    )}\n`
  );
}

(async () => {
  await main().catch(console.error);
})();
