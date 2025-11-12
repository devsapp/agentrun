import inquirer from "inquirer";

export async function promptForConfirmOrDetails(
  message: string,
): Promise<boolean> {
  const answers: any = await inquirer.prompt([
    {
      type: "list",
      name: "prompt",
      message,
      choices: ["yes", "no"],
    },
  ]);

  return answers.prompt === "yes";
}
