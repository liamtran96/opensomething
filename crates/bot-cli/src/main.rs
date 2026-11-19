use std::io::{self, Write};

fn main() -> io::Result<()> {
    loop {
        print!("you> ");
        io::stdout().flush()?;

        let mut line = String::new();
        let bytes_read = io::stdin().read_line(&mut line)?;
        if bytes_read == 0 {
            break;
        }

        let message = line.trim();
        if message == "/quit" {
            break;
        }

        println!("bot> {message}");
    }

    Ok(())
}
