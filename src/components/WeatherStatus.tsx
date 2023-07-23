export default function WeatherStatus({ message }: { message: string }) {
    return (
        <div>
            {message.split("\n").map((val, key) => (
                <p key={key}>{val}</p>
            ))}
        </div>
    );
}
