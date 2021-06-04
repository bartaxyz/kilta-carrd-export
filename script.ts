import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import * as path from "path";
import { JSDOM } from "jsdom";

import fetch from "node-fetch";

const GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE || ".";

(async () => {
  const file = await (await fetch("https://kiltakilta.carrd.co/")).text();

  const dom = new JSDOM(file);

  const profiles: {
    name: string;
    profileLink: string;
    position: string;
    positionLink?: string;
    positionName?: string;
    description?: string;
    expertise?: string[];
    picture?: string;
    links?: {
      label: string;
      href: string;
    }[];
  }[] = [];

  // This prints "My First JSDOM!"
  const profileNodes = Array.from(
    dom.window.document.querySelectorAll("section[id*=profile]")
  );

  profileNodes.forEach((profileNode) => {
    const profileDiv = profileNode.children[1].children[0].children[0];
    const experienceDiv = profileNode.children[3];

    const name =
      profileDiv.children[1].children[0].querySelector(
        "span:first-of-type"
      ).textContent;

    const positionLinkNode = profileDiv.children[1].children[0]
      .querySelector("span:last-of-type")
      .querySelector("a, u");
    const positionLink = positionLinkNode?.getAttribute("href");
    const positionName = positionLinkNode?.textContent;

    const position = profileDiv.children[1].children[0]
      .querySelector("span:last-of-type")
      .textContent.replace(/\s+/g, " ")
      .replace(/\\n/, "")
      // Remove company name
      .replace(positionName, "");

    const description = profileDiv.children[1].children[1].innerHTML;

    const expertise = profileDiv.children[1].children[2].textContent
      .split("•")
      .map((str) => str.trim());

    const picture = profileDiv.children[0].children[0]
      .getElementsByTagName("img")[0]
      .getAttribute("src");
    const links = Array.from(profileDiv.children[0].children[1].children).map(
      (child) => {
        return {
          label: child.getElementsByClassName("label")[0].textContent,
          href: child.getElementsByTagName("a")[0].getAttribute("href"),
        };
      }
    );

    profiles.push({
      name,
      profileLink: name.toLowerCase().replace(/\s+/g, ""),
      position,
      positionLink,
      positionName,
      description,
      expertise,
      picture,
      links,
    });
  });

  console.log(profiles);

  /* Create HTML */

  if (!existsSync(path.join(GITHUB_WORKSPACE, "profiles"))) {
    mkdirSync(path.join(GITHUB_WORKSPACE, "profiles"));
  }

  profiles.forEach((profile) => {
    const html = `
  <!DOCTYPE html>
  <html>
    <title>Carrd Alternative - You're welcome, Martin</title>

    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/milligram/1.4.1/milligram.min.css"
    />
  </html>

  <body>
  <div class="container">

  <h1><p><a href="/">Kilta People</a></p></h1>



    <section>
      <div class="row">
        <div class="column column-33">
          <img
            src="https://kiltakilta.carrd.co/${profile.picture}"
            style="border-radius:50%;"
          />
        </div>

        <div class="column column-50">
          <h1>${profile.name}</h1>
          <p>${profile.position} <u>${profile.positionName}</u></p>

          <div>
            <p>
              ${profile.description}
            </p>
          </div>

          <div>
            <p>
              ${profile.expertise.join(" &middot; ")}
            </p>
          </div>

          <div>
            ${profile.links
              .map(
                (link) => `
              <a href="${link.href}">
                ${link.label}
              </a>
            `
              )
              .join(" &middot; ")}
          </div>
        </div>
      </div>

    </section>
    

  `;

    writeFileSync(
      path.join(GITHUB_WORKSPACE, "profiles", profile.profileLink + ".html"),
      html,
      {
        encoding: "utf-8",
      }
    );

    /* writeFileSync(`./profiles/${profile.profileLink}.html`, html, {
      encoding: "utf-8",
    }); */
  });

  const html = `
<!DOCTYPE html>
<html>
  <title>Carrd Alternative - You're welcome, Martin</title>

  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/milligram/1.4.1/milligram.min.css"
  />
</html>

<body>
<div class="container">

<h1><p><a href="/">Kilta People</a></p></h1>

${profiles
  .map((profile) => {
    return `
    <section>
      <a href="./profiles/${profile.profileLink}">${profile.name}</a>
    </section>
  `;
  })
  .join("")}

`;

  writeFileSync(path.join(GITHUB_WORKSPACE, "index.html"), html, {
    encoding: "utf-8",
  });

  /* writeFileSync("./index.html", html, { encoding: "utf-8" }); */
})();
