# Add Variables to Github Repo

The `github_secrets.sh` convenience script is available to help you add variables to the repo.

1. Install Github CLI
2. Authenticate Github CLI
3. Duplicate the `sample.env` file and rename to `.env`
4. Update the environment variables with your specific environment
5. Run the script with your organization as a switch  
  `github_secrets.sh <org>`

To Add a new Organization, modify the switch statement in the script and add your Org.
