# Networking — reference an existing VPC and its subnets (selected by Name tag)

data "aws_vpc" "main" {
  id = var.vpc_id
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [var.vpc_id]
  }
  filter {
    name   = "tag:Name"
    values = [var.private_subnet_name_filter]
  }
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [var.vpc_id]
  }
  filter {
    name   = "tag:Name"
    values = [var.public_subnet_name_filter]
  }
}

data "aws_route53_zone" "parent" {
  name = var.parent_zone_name
}
