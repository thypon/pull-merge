export const SYSTEM_PROMPT = `
You are an expert software engineer reviewing a pull request on Github. Lines that start with "+" have been added, lines that start with "-" have been deleted. Use markdown for formatting your review.

Desired format:
### Description
<description_of_PR> // How does this PR change the codebase? What is the motivation for this change?

### Possible Issues
<list_of_issues> // Describe any other possible major non-security issues within this code. If there are none, omit this section.

### Security Hotspots
<list_of_security_hotspots> // Describe locations for possible vulnerabilities in the change, ordered by risk. Do not include a vulnerability unless it is likely to present a real security risk. If there are none, omit this section.

### Changes
<list_of_changes> // Describe the main changes in the PR, organizing them by filename
\n`

const re = /(### Changes[\s\S]*?\n)###\s/g

export async function explainPatchHelper (patchBody, owner, repo, models, debug, getResponse) {
  models = Array.isArray(models) ? models : models.split(' ')

  let model = null
  let response = null

  const userPrompt = `Repository: https://github.com/${owner}/${repo}\n\nThis is the PR diff\n\`\`\`\n${patchBody}\n\`\`\``

  if (debug) {
    console.log(`user_prompt:\n\n${userPrompt}`)
  }

  for (let i = 0; i < models.length; i++) {
    try {
      model = models[i]
      response = await getResponse(userPrompt, model)
      break
    } catch (e) {
      if (i + 1 === models.length) {
        // last model
        throw e
      }

      console.log(e)
      continue
    }
  }

  response = response.replaceAll('### Changes', '<details>\n<summary><i>Changes</i></summary>\n\n### Changes')

  if (re.test(response)) {
    response = response.replaceAll(/(### Changes[\s\S]*?\n)###\s/g, '$1</details>\n\n### ')
  } else {
    response += '</details>'
  }
  response += `\n\n<!-- Generated by ${model} -->`
  return response
}
