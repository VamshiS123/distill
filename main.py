import json

from distill.distill import PromptCompressor

prompt = [
    """
**The Oakhaven Reservoir Construction Project**

The municipal council of Oakhaven has approved the construction of a new massive water reservoir to support the city's expanding agricultural district. You have been hired as the lead project manager to calculate the final budget and the exact completion time. The reservoir is to be excavated in the shape of an inverted frustum of a right circular cone. The circular opening at the ground level has a radius of exactly 50 meters, while the circular bottom of the reservoir, located 20 meters vertically below ground level, has a radius of 30 meters. To assist with your volume calculations, note that the volume of a frustum is found by adding the square of the top radius to the square of the bottom radius, adding the product of the two radii to that sum, multiplying the result by the height and by pi, and finally dividing by three. For all calculations, you must use the value of pi as 3.14159.

The excavation process is complicated by the geological composition of the ground. The top 8 meters of depth consist of loose sandy soil, while the remaining bottom 12 meters consist of dense granite bedrock. You have two teams of excavators available: Team Alpha and Team Beta. Team Alpha consists of 4 heavy-duty machines, and Team Beta consists of 6 lighter machines.

In the sandy soil layer, a single Team Alpha machine can excavate 15 cubic meters per hour, while a single Team Beta machine can excavate 10 cubic meters per hour. However, once the digging reaches the granite layer, the excavation rates slow down significantly. In granite, a Team Alpha machine excavates only 5 cubic meters per hour, and a Team Beta machine excavates only 2 cubic meters per hour. Furthermore, due to the hardness of the granite, the drill bits on Team Beta machines wear out quickly. For every 100 cubic meters of granite removed collectively by Team Beta, the entire team must stop work for exactly 45 minutes to replace their equipment. Team Alpha does not require these stoppages.

Work is performed in shifts. The site operates 24 hours a day. Shift 1 runs from 08:00 to 16:00, Shift 2 runs from 16:00 to 00:00, and Shift 3 runs from 00:00 to 08:00. During Shift 3, visibility is poor, which reduces the excavation efficiency of all machines by exactly 20 percent regardless of the soil type.

Once the excavation is entirely complete, the interior surface of the reservoir (the circular bottom and the slanted side walls, but not the top opening) must be coated with a waterproof sealant. The slant height of the reservoir walls must be calculated using the Pythagorean theorem based on the vertical depth and the difference in radii. The sealant is applied by a separate crew that can cover 200 square meters per hour. This crew only works during Shift 1 and Shift 2. The sealant costs 45 dollars per square meter, but if the total surface area exceeds 6,000 square meters, a bulk discount of 15 percent is applied to the cost of the sealant for the entire area.

After the sealant is applied and dried (which takes a fixed duration of 24 hours where no other work can happen), the reservoir must be filled with water to exactly 90 percent of its total volume. Two input pipes, Pipe A and Pipe B, are available for filling. Pipe A pumps water at a rate of 400 cubic meters per hour, and Pipe B pumps at a rate of 350 cubic meters per hour. Both pipes are turned on simultaneously at the start of the filling phase. However, Pipe A is connected to an old generator and shuts down for 1 hour of maintenance after every 5 continuous hours of pumping. Pipe B runs continuously without interruption.

Complicating the filling phase is the natural evaporation of the water. Water evaporates from the surface at a rate of 0.5 cubic meters per hour for every 100 square meters of the current surface area of the water. For the sake of this estimation, you may approximate the evaporation loss by calculating the surface area of the water when the reservoir is half-full (by volume) and assuming that constant rate of evaporation applies throughout the entire filling process.

Finally, there is a strict budget constraint regarding labor costs. Team Alpha machines cost 250 dollars per machine per hour to operate. Team Beta machines cost 150 dollars per machine per hour. The sealant crew costs a flat rate of 1,200 dollars per hour for the whole crew. Water costs 0.10 dollars per cubic meter.

**The Questions:**

1. What is the total volume of the reservoir in cubic meters?
2. How many hours will it take to complete the excavation of the sandy soil layer?
3. How many hours will it take to complete the excavation of the granite layer, accounting for the efficiency drop at night and Team Beta's maintenance breaks?
4. What is the total cost of the waterproof sealant application?
5. How long will the filling process take in hours, accounting for the variable pumping rates and the estimated evaporation?
6. If the project begins at 08:00 on a Monday, what is the exact day and time the reservoir reaches 90 percent capacity?
7. What is the grand total cost of the entire project, including excavation labor, sealant labor and materials, and the cost of the water?
    """
]

llm_lingua = PromptCompressor(
    model_name="./models",
    use_llmlingua2=True,  # Whether to use llmlingua-2
    device_map="mps"
)
compressed_prompt = llm_lingua.compress_prompt(prompt, rate=0.33, force_tokens=['\n', '?'])

print(json.dumps(compressed_prompt, indent=2))
