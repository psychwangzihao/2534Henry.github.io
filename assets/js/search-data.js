// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-",
    title: "",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-news",
          title: "news",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/news/";
          },
        },{id: "nav-playground",
          title: "playground",
          description: "Self-made psychological experiment programs. Read about the science behind each one, and run the interactive ones directly in your browser.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/playground/";
          },
        },{id: "nav-publications",
          title: "publications",
          description: "Peer-reviewed publications and preprints.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
          },
        },{id: "nav-cv",
          title: "CV",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "news-completed-the-oxford-prospects-winter-visit-jan-feb-2026-in-psychology-receiving-the-best-presentation-award-and-best-film-award",
          title: 'Completed the Oxford Prospects Winter Visit (Jan–Feb 2026) in Psychology, receiving the Best...',
          description: "",
          section: "News",},{id: "news-won-the-excellent-poster-award-at-the-psychology-honor-s-program-research-exhibition-zhejiang-university",
          title: 'Won the Excellent Poster Award at the Psychology (Honor’s Program) Research Exhibition, Zhejiang...',
          description: "",
          section: "News",},{id: "news-led-the-psychology-outreach-series-at-the-2050-2026-global-youth-gathering-as-lead-organizer-amp-amp-initiator",
          title: 'Led the Psychology Outreach Series at the 2050@2026 Global Youth Gathering as Lead...',
          description: "",
          section: "News",},{id: "news-launched-consciousness-observers-co-lab-an-interdisciplinary-platform-for-consciousness-research-based-at-zhejiang-university",
          title: 'Launched Consciousness Observers (CO-LAB), an interdisciplinary platform for consciousness research based at Zhejiang...',
          description: "",
          section: "News",},{id: "news-invited-by-westlake-university-and-the-joint-academy-on-future-humanity-to-participate-in-the-future-civilization-sandbox-as-a-theme-advocate-leading-the-discussion-topic-decoding-social-interaction-what-ai-can-and-cannot-replace",
          title: 'Invited by Westlake University and the Joint Academy on Future Humanity to participate...',
          description: "",
          section: "News",},{id: "news-preparing-an-interactive-talk-connecting-the-dots-for-the-incoming-cohort-of-the-department-of-psychology-zhejiang-university-an-interactive-visual-journey-across-interdisciplinary-science-the-2050-gathering-studying-abroad-and-consciousness-research",
          title: 'Preparing an interactive talk, Connecting the Dots, for the incoming cohort of the...',
          description: "",
          section: "News",},{
        id: 'social-cv',
        title: 'CV',
        section: 'Socials',
        handler: () => {
          window.open("/assets/pdf/CV_WangZihao_ZJU.pdf", "_blank");
        },
      },{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%70%73%79%63%68%77%61%6E%67%7A%69%68%61%6F@%7A%6A%75.%65%64%75.%63%6E", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/psychwangzihao", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
