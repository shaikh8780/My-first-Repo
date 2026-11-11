# ECS Fargate Service for backend API

resource "aws_security_group" "ecs" {
  name        = "${var.project_name}-ecs"
  description = "ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_ecs_cluster" "app" {
  name = var.project_name
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.project_name}"
  retention_in_days = 14
}

resource "aws_iam_role" "ecs_exec" {
  name = "${var.project_name}-ecs-exec"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" } }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_exec" {
  role       = aws_iam_role.ecs_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-ecs-task"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" } }]
  })
}

resource "aws_iam_role_policy" "ecs_task" {
  name = "${var.project_name}-task-policy"
  role = aws_iam_role.ecs_task.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Exactly the calls backend/store.py makes on this one table: get_item,
        # put_item, delete_item, and query (query_pk(), used to list tracked
        # drafts and to reset a report). No table, stream or backup actions.
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem", "dynamodb:Query"]
        Resource = [aws_dynamodb_table.main.arn]
      },
      {
        # The in-editor AI (backend/ai.py) invokes an ON_DEMAND foundation model
        # (Claude 3 Haiku — MVP: cheap/fast, no powerful model needed), which is
        # callable directly via the foundation-model ARN. Deliberately NOT adding
        # inference-profile/* — the 4.x models are profile-only and would need it,
        # but we keep permissions minimal by staying on an on-demand model.
        # Scoped to the one configured model in the deployment region. A model
        # that is only callable through an inference profile also needs the
        # profile ARN here (see FR-067).
        Effect   = "Allow"
        Action   = ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"]
        Resource = ["arn:aws:bedrock:${var.aws_region}::foundation-model/${var.bedrock_model_id}"]
      },
    ]
  })
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project_name}-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_exec.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name         = "api"
    image        = var.backend_image != "" ? var.backend_image : "${aws_ecr_repository.backend.repository_url}:latest"
    essential    = true
    portMappings = [{ containerPort = 8000, protocol = "tcp" }]
    environment = [
      { name = "AWS_REGION", value = var.aws_region },
      { name = "APP_NAME", value = var.app_name },
      { name = "APP_HOSTNAME", value = var.domain_name },
      { name = "COGNITO_USER_POOL_ID", value = var.cognito_user_pool_id },
      { name = "COGNITO_CLIENT_ID", value = aws_cognito_user_pool_client.app.id },
      { name = "COGNITO_DOMAIN", value = var.cognito_domain },
      { name = "DYNAMODB_TABLE", value = aws_dynamodb_table.main.name },
      # MVP: Claude 3 Haiku — ON_DEMAND, invokable via the foundation-model ARN
      # (no inference-profile IAM needed). Bump to a 4.x profile later if desired.
      { name = "BEDROCK_MODEL_ID", value = var.bedrock_model_id },
      # Comma-separated aliases with admin rights (backend/routers/api.py).
      { name = "ADMIN_ALIASES", value = join(",", var.admin_aliases) },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options   = { "awslogs-group" = aws_cloudwatch_log_group.app.name, "awslogs-region" = var.aws_region, "awslogs-stream-prefix" = "api" }
    }
  }])
}

resource "aws_ecs_service" "api" {
  name            = "${var.project_name}-api"
  cluster         = aws_ecs_cluster.app.id
  task_definition = aws_ecs_task_definition.api.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  network_configuration {
    subnets          = data.aws_subnets.private.ids
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 8000
  }
  force_new_deployment = true
  depends_on           = [aws_lb_listener.https]
}
