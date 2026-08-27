const SIX_CS = [
  "1) Critical & Creative Thinking",
  "2) Complex Problem Solving",
  "3) Communication",
  "4) Continuous Lifelong Learning",
  "5) Cultural Awareness",
  "6) Community Spirit / Collaboration"
];

const TEMPLATE_REGISTRY = (() => {
  return {
    "lesson-plan": {
      id: "lesson-plan",
      name: "Lesson Plan",
      ext: "docx",
      assetKey: "lessonPlan",
      templateType: "Word",
      defaultPrefix: "Lesson Plan",
      stringKeys: ["grade", "course_name", "teacher", "week", "lesson"],
      listKeys: [
        "objectives",
        "gain_attention",
        "introduction",
        "prior_knowledge",
        "progression",
        "evaluation",
        "assessments",
        "homework"
      ],
      extraKeys: ["selected_6cs_indices"],
      sample: {
        grade: "Grade 10",
        course_name: "AP Computer Science A",
        teacher: "Ms. Zhang",
        week: "Week 3",
        lesson: "2",
        objectives: [
          "Explain the base case and recursive case in a recursive method.",
          "Trace recursive calls using a call stack diagram."
        ],
        gain_attention: [
          "Show a nested set of boxes and ask students how they would describe opening all boxes with one repeated rule."
        ],
        introduction: [
          "Introduce recursion as a method that solves a problem by calling itself on a smaller version of the problem."
        ],
        prior_knowledge: [
          "Students should already understand methods, parameters, return values, and conditional statements."
        ],
        progression: [
          "Model a simple countdown recursion example.",
          "Guide students through tracing a factorial method.",
          "Let students complete a short paired trace activity."
        ],
        evaluation: [
          "Use cold-call tracing checkpoints after each modeled example.",
          "Collect exit tickets asking students to identify base and recursive cases."
        ],
        assessments: [
          "Students complete one recursive trace independently.",
          "Students write a base case for a partially completed method."
        ],
        homework: [
          "Finish the recursion trace worksheet.",
          "Read the next section on recursive searching."
        ],
        selected_6cs_indices: [1, 2, 3]
      }
    },
    "course-syllabus": {
      id: "course-syllabus",
      name: "Course Syllabus",
      ext: "xlsx",
      assetKey: "courseSyllabus",
      templateType: "Excel",
      defaultPrefix: "Course Syllabus",
      stringKeys: [
        "course_name",
        "semester",
        "instructor",
        "email",
        "grade",
        "credit"
      ],
      listKeys: [
        "prerequisites_for_the_course",
        "course_description",
        "course_goals",
        "student_learning_outcomes",
        "course_requirements"
      ],
      dictListKeys: {
        teaching_plan: ["topic", "key_content", "key_objectives"]
      },
      extraKeys: [],
      sample: {
        course_name: "Integrated Science",
        semester: "2026 Spring",
        instructor: "Ms. Zhang",
        email: "science@example.com",
        grade: "Grade 8",
        credit: "1",
        prerequisites_for_the_course: [
          "Students should be able to read basic scientific diagrams.",
          "Students should understand safe classroom lab behavior."
        ],
        course_description: [
          "This course introduces core concepts in life science, physical science, and scientific inquiry."
        ],
        course_goals: [
          "Build students' ability to ask testable questions and explain evidence.",
          "Develop practical observation, recording, and data interpretation skills."
        ],
        student_learning_outcomes: [
          "Students can design a simple fair test.",
          "Students can explain patterns in data using scientific vocabulary."
        ],
        course_requirements: [
          "Complete weekly practice tasks.",
          "Maintain an organized science notebook.",
          "Follow all lab safety expectations."
        ],
        teaching_plan: [
          {
            topic: "Scientific Inquiry",
            key_content: "Variables, hypotheses, and fair tests",
            key_objectives: "Identify variables and write testable questions"
          },
          {
            topic: "Lab Safety",
            key_content: "Safety symbols and classroom procedures",
            key_objectives: "Apply safety routines during practical work"
          }
        ]
      }
    },
    "club-work-plan": {
      id: "club-work-plan",
      name: "社团工作计划",
      ext: "docx",
      assetKey: "clubWorkPlan",
      templateType: "Word",
      mode: "template-docx",
      defaultPrefix: "社团工作计划",
      stringKeys: [
        "school_type",
        "department",
        "department_en",
        "academic_year",
        "semester_name",
        "semester_en",
        "course_name",
        "expected_participants",
        "teacher_in_charge"
      ],
      listKeys: [
        "guiding_ideology",
        "work_objectives",
        "key_work_priorities",
        "specific_measures",
        "characteristic_activities"
      ],
      dictListKeys: {
        monthly_plan: ["month", "content"],
        weekly_plan: ["week_number", "date_display", "content"]
      },
      extraKeys: [],
      sample: {
        school_type: "junior",
        department: "国内部",
        department_en: "Domestic Department",
        academic_year: "2025-2026学年度",
        semester_name: "下学期",
        semester_en: "Second Semester of the 2025-2026 Academic Year",
        course_name: "科学探究社",
        expected_participants: "20",
        teacher_in_charge: "张老师",
        guiding_ideology: [
          "以科学探究和实践创新为核心，引导学生在真实问题中学习科学方法。",
          "通过项目式学习培养学生的观察、实验、合作和表达能力。"
        ],
        work_objectives: [
          "完成至少三个主题探究活动。",
          "形成一份学生科学作品或展示成果。",
          "提升学生实验安全意识和过程记录能力。"
        ],
        key_work_priorities: [
          "规范实验准备与安全管理。",
          "推进小组项目过程记录。",
          "组织阶段性展示和反思。"
        ],
        specific_measures: [
          "每次活动前明确器材清单和安全要求。",
          "使用活动记录表跟踪学生小组进展。",
          "定期组织学生进行口头展示和互评。"
        ],
        monthly_plan: [
          { month: "三月", content: "完成社团组建、主题介绍和安全规范训练。" },
          { month: "四月", content: "开展第一个科学探究项目，训练观察和记录。" },
          { month: "五月", content: "推进小组项目制作与阶段展示。" },
          { month: "六月", content: "完成成果展示、总结和资料归档。" }
        ],
        weekly_plan: [
          { week_number: 1, date_display: "3.1-3.7", content: "社团介绍、成员分组与安全规范。" },
          { week_number: 2, date_display: "3.8-3.14", content: "确定探究主题并完成材料准备。" },
          { week_number: 3, date_display: "3.15-3.21", content: "开展第一次探究活动并记录结果。" }
        ],
        characteristic_activities: [
          "科学问题挑战活动。",
          "小组实验成果展示。",
          "学生科学作品交流。"
        ]
      }
    },
    "club-work-summary": {
      id: "club-work-summary",
      name: "社团工作总结",
      ext: "docx",
      assetKey: "clubWorkSummary",
      templateType: "图文 Word",
      mode: "summary-docx",
      defaultPrefix: "社团工作总结",
      requiresImages: true,
      stringKeys: [
        "title",
        "subtitle",
        "club_name",
        "semester",
        "overview",
        "achievements",
        "outlook",
        "photos_intro"
      ],
      listKeys: ["course_review", "photo_captions"],
      extraKeys: ["reflection.success", "reflection.problems", "reflection.improvements"],
      sample: {
        title: "武汉开明中学国内部科学探究社团工作总结",
        subtitle: "Summary of Science Inquiry Club",
        club_name: "科学探究社",
        semester: "2025-2026学年第二学期",
        overview: "本学期科学探究社以真实问题探究为主线，引导学生围绕校园生活中的科学现象开展观察、实验、记录与展示。社团强调动手实践和小组合作，帮助学生在持续活动中理解科学方法。",
        course_review: [
          "3月：完成社团组建、安全规范训练和主题导入。",
          "4月：围绕实验观察和变量控制开展基础探究活动。",
          "5月：推进小组项目制作，完成阶段性成果展示。",
          "6月：完成成果整理、照片归档和社团总结。"
        ],
        achievements: "学生能够围绕明确问题开展小组探究，并通过照片、记录表和口头讲解展示过程成果。多数学生在实验安全、过程记录和合作表达方面有明显提升。",
        reflection: {
          success: "以小组项目作为主线，学生参与度较高，活动过程更容易形成可展示成果。",
          problems: "部分学生记录不够规范，阶段性材料整理仍需加强。",
          improvements: "后续将统一活动记录格式，增加中期检查和成果展示评价表。"
        },
        outlook: "下一阶段社团将继续围绕校园科学问题开展探究活动，并加强项目文档、照片留存和成果表达训练。",
        photos_intro: "以下为本学期社团活动与成果展示照片。",
        photo_captions: ["学生开展小组实验观察。", "社团成员展示阶段性成果。"]
      }
    },
    "weekly-brief": {
      id: "weekly-brief",
      name: "国际部周工作简报",
      ext: "png",
      assetKey: "weeklyBrief",
      templateType: "图片简报",
      mode: "brief-png",
      defaultPrefix: "国际部周工作简报",
      requiresImages: true,
      stringKeys: ["zh_body", "en_body"],
      listKeys: ["photo_captions"],
      extraKeys: [],
      sample: {
        zh_body: "为提升学生科学探究与表达能力，10月15日，国际部组织学生开展科学实践展示活动。学生围绕实验观察、数据记录和成果讲解进行交流，在真实任务中深化科学方法理解，提升合作学习与公开表达能力。",
        en_body: "To strengthen students' scientific inquiry and presentation skills, the International Department organized a science practice showcase on October 15. Students shared their observations, data records, and project explanations, deepening their understanding of scientific methods while improving collaboration and public communication.",
        photo_captions: ["学生进行实验观察。", "小组记录实验数据。", "学生展示项目成果。", "师生交流活动反馈。"]
      }
    }
  };
})();
